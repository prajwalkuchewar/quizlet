import os

import numpy as np
import pytest

from app.config import settings
from app.services import embedding_service

requires_model = pytest.mark.skipif(
    "RUN_EMBEDDING_MODEL_TESTS" not in os.environ,
    reason="set RUN_EMBEDDING_MODEL_TESTS=1 to run tests that load the local embedding model")

DOCUMENT = ("Photosynthesis is the process plants, algae, and some bacteria use to convert light energy "
            "into chemical energy stored in glucose.")
DISTRACTORS = [
    "The French Revolution began in 1789 and ended the monarchy.",
    "A Python function is a reusable block of instructions that may take parameters.",
]


@requires_model
def test_local_model_retrieves_paraphrased_question(monkeypatch):
    monkeypatch.setattr(settings, "embedding_provider", "local")
    docs = np.array(embedding_service.embed_texts([DOCUMENT, *DISTRACTORS]))
    assert docs.shape == (3, embedding_service.DIMENSIONS)
    # Shares almost no words with the document, so only a semantic model ranks it first.
    query = np.array(embedding_service.embed_texts(["How does sunlight help plants make food?"])[0])
    assert int(np.argmax(docs @ query)) == 0


def test_hash_provider_is_deterministic(monkeypatch):
    monkeypatch.setattr(settings, "embedding_provider", "hash")
    first = embedding_service.embed_texts([DOCUMENT])
    assert first == embedding_service.embed_texts([DOCUMENT])
    assert len(first[0]) == embedding_service.DIMENSIONS
