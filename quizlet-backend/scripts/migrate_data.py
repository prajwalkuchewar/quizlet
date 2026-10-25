"""Import data from the three Spring service databases into the FastAPI database.

Run from quizlet-backend/ with `python -m scripts.migrate_data` for a dry run, or add
`--apply` to write. Source databases are only read. The target write is atomic.

Set AUTH_SOURCE_URL, QUESTION_SOURCE_URL, and QUIZ_SOURCE_URL to the Spring databases.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from collections import defaultdict

from sqlalchemy import MetaData, Table, create_engine, inspect, select, text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base
from app.models import Question, Quiz, User


SOURCE_NAMES = ("auth", "question", "quiz")


def normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def read_table(engine, candidates: tuple[str, ...], label: str) -> list[dict]:
    inspector = inspect(engine)
    available = inspector.get_table_names()
    table_name = next((name for candidate in candidates for name in available
                       if name.lower() == candidate.lower()), None)
    if table_name is None:
        raise RuntimeError(f"Could not find {label} table. Looked for {candidates}; found {available}.")
    table = Table(table_name, MetaData(), autoload_with=engine)
    with engine.connect() as connection:
        return [dict(row) for row in connection.execute(select(table)).mappings().all()]


def index_row(row: dict) -> dict[str, object]:
    return {normalized(key): value for key, value in row.items()}


def value(row: dict[str, object], *names: str, required: bool = True, default=None):
    indexed = index_row(row)
    for name in names:
        key = normalized(name)
        if key in indexed:
            return indexed[key]
    if required:
        raise RuntimeError(f"Missing required column (one of {names}) in source row: {tuple(row)}")
    return default


def source_url(name: str) -> str:
    env_name = f"{name.upper()}_SOURCE_URL"
    url = os.getenv(env_name)
    if not url:
        raise RuntimeError(f"Set {env_name} to the {name} source database URL.")
    return url


def load_source_rows():
    engines = {name: create_engine(source_url(name)) for name in SOURCE_NAMES}
    try:
        users = read_table(engines["auth"], ("users",), "users")
        questions = read_table(engines["question"], ("question", "questions"), "questions")
        quizzes = read_table(engines["quiz"], ("quiz", "quizzes"), "quizzes")

        quiz_tables = inspect(engines["quiz"]).get_table_names()
        relation_name = next((table for table in quiz_tables
                              if normalized(table) in {"quizquestionids", "quizquestions"}), None)
        relations = read_table(engines["quiz"], (relation_name,), "quiz question links") if relation_name else []
        return users, questions, quizzes, relations, engines
    except Exception:
        for engine in engines.values():
            engine.dispose()
        raise


def build_payload(users, questions, quizzes, relations):
    user_data = []
    for row in users:
        user_data.append({
            "id": value(row, "id"), "firstname": value(row, "firstname"),
            "lastname": value(row, "lastname"), "username": value(row, "username"),
            "password": value(row, "password"), "role": str(value(row, "role")),
        })

    question_fields = ("questionTitle", "option1", "option2", "option3", "option4",
                       "rightAnswer", "difficultyLevel", "category")
    question_data = []
    for row in questions:
        question_data.append({"id": value(row, "id"), **{field: value(row, field) for field in question_fields}})

    quiz_data = [{"id": value(row, "id"), "title": value(row, "title")} for row in quizzes]
    links: dict[int, list[int]] = defaultdict(list)
    for row in relations:
        quiz_id = value(row, "quiz_id", "quizid")
        question_id = value(row, "question_ids", "question_id", "questionids", "questionid")
        links[int(quiz_id)].append(int(question_id))

    question_ids = {int(row["id"]) for row in question_data}
    quiz_ids = {int(row["id"]) for row in quiz_data}
    unknown_quizzes = set(links) - quiz_ids
    unknown_questions = {qid for ids in links.values() for qid in ids} - question_ids
    if unknown_quizzes or unknown_questions:
        raise RuntimeError(f"Broken quiz links; unknown quiz IDs={sorted(unknown_quizzes)}, "
                           f"unknown question IDs={sorted(unknown_questions)}")
    return user_data, question_data, quiz_data, links


def write_target(payload, target_url: str):
    target_engine = create_engine(target_url)
    Base.metadata.create_all(bind=target_engine)
    users, questions, quizzes, links = payload
    with Session(target_engine) as session, session.begin():
        for row in users:
            existing = session.get(User, row["id"])
            if existing is None:
                session.add(User(**row))
            else:
                for key, item in row.items():
                    setattr(existing, key, item)

        for row in questions:
            existing = session.get(Question, row["id"])
            if existing is None:
                session.add(Question(**row))
            else:
                for key, item in row.items():
                    setattr(existing, key, item)

        session.flush()
        for row in quizzes:
            quiz = session.get(Quiz, row["id"])
            if quiz is None:
                quiz = Quiz(id=row["id"], title=row["title"])
                session.add(quiz)
            else:
                quiz.title = row["title"]
            quiz.questions = [session.get(Question, qid) for qid in links.get(int(row["id"]), [])]

    if target_engine.dialect.name == "postgresql":
        with target_engine.begin() as connection:
            for table_name in ("users", "questions", "quizzes"):
                connection.execute(text(
                    "SELECT setval(pg_get_serial_sequence(:table_name, 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM {table_name}), 1), "
                    f"EXISTS (SELECT 1 FROM {table_name}))"
                ), {"table_name": table_name})
    target_engine.dispose()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write the validated import into DATABASE_URL")
    args = parser.parse_args()
    target_url = os.getenv("DATABASE_URL", settings.database_url)
    users, questions, quizzes, relations, engines = load_source_rows()
    try:
        payload = build_payload(users, questions, quizzes, relations)
        print(f"Source rows: {len(users)} users, {len(questions)} questions, "
              f"{len(quizzes)} quizzes, {len(relations)} quiz-question links.")
        if not args.apply:
            print("Dry run only; target database was not changed. Add --apply to import.")
            return
        write_target(payload, target_url)
        print(f"Import committed to DATABASE_URL ({target_url.split('@')[-1]}).")
    finally:
        for engine in engines.values():
            engine.dispose()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Migration failed: {exc}", file=sys.stderr)
        sys.exit(1)
