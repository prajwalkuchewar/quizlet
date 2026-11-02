"""Zero-cost retrieval check: ranks stored chunks for test queries without calling any LLM API.

Only the local embedding model runs, so this costs nothing and uses no Groq quota.

    docker compose exec backend python -m app.retrieval_check <username> <cases.json>

cases.json is a list of {"query": str, "expect": str | null, "kind": str}. "expect" is a phrase that
must appear in a correct chunk; null marks a query with no correct chunk (unrelated or off-topic).
"""
import json
import sys

from app.database import SessionLocal
from app.models import User
from app.services.question_service import search_materials

TOP_K = 5
# Queries with no correct chunk pass only when their best similarity stays below this value.
UNRELATED_MAX_SCORE = 0.3


def main() -> None:
    username, cases_path = sys.argv[1], sys.argv[2]
    with open(cases_path, encoding="utf-8") as handle:
        cases = json.load(handle)
    with SessionLocal() as db:
        owner = db.query(User).filter(User.username == username).one()
        scored = 0
        hit_at_1 = hit_at_3 = 0
        reciprocal_rank = 0.0
        for case in cases:
            hits = search_materials(db, owner, "retrieval-check", case["query"], None, TOP_K)
            contents = [chunk.content for chunk, _ in hits]
            scores = [round(score, 2) for _, score in hits]
            rank = None
            if case.get("expect"):
                for position, content in enumerate(contents, 1):
                    if case["expect"].lower() in content.lower():
                        rank = position
                        break
                scored += 1
                hit_at_1 += rank == 1
                hit_at_3 += rank is not None and rank <= 3
                reciprocal_rank += 1 / rank if rank else 0.0
            if case.get("expect"):
                passed = rank is not None and rank <= 3
            else:
                passed = max(scores, default=0) < UNRELATED_MAX_SCORE
            status = "PASS" if passed else "FAIL"
            print(f"{status} [{case.get('kind', '')}] rank={rank} scores={scores} :: {case['query']}")
        if scored:
            print(f"Recall@1={hit_at_1 / scored:.2f} Recall@3={hit_at_3 / scored:.2f} "
                  f"MRR={reciprocal_rank / scored:.3f} over {scored} scored queries")


if __name__ == "__main__":
    main()
