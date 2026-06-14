"""Local embedding model wrapper.

Loads sentence-transformers' all-MiniLM-L6-v2 once on first use.
Model card: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
- 384-dimensional embeddings
- ~90MB on disk
- Fast on CPU; designed for sentence-level semantic similarity
"""

from sentence_transformers import SentenceTransformer

_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Lazy-load the model on first call. Cached for subsequent calls."""
    global _model
    if _model is None:
        print(f"Loading embedding model {_MODEL_NAME}...")
        _model = SentenceTransformer(_MODEL_NAME)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-embed a list of texts. Returns list of 384-dim vectors."""
    model = get_model()
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return embeddings.tolist()


def embed_query(text: str) -> list[float]:
    """Embed a single query string."""
    return embed_texts([text])[0]