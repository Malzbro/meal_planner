"""Build the Chroma vector store from the SQLite recipes.

Run this once after loading the database. It reads all recipes,
builds embedding text, generates vectors, and writes them to ./data/chroma/.
"""

from pathlib import Path
import chromadb

from db.session import SessionLocal
from db.models import Recipe
from rag.embedder import embed_texts
from rag.embedding_text import recipe_to_embedding_text


import os
_default_data = Path(__file__).resolve().parent.parent.parent / "data"
DATA_DIR = Path(os.getenv("DATA_DIR", str(_default_data)))
CHROMA_DIR = DATA_DIR / "chroma"
COLLECTION_NAME = "recipes"


def get_chroma_client() -> chromadb.PersistentClient:
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def get_collection():
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def build_index() -> None:
    """Read all recipes from SQL, embed them, store in Chroma."""
    client = get_chroma_client()
    # Fresh build — drop any existing collection
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    session = SessionLocal()
    recipes = session.query(Recipe).all()
    print(f"Building index for {len(recipes)} recipes...")

    ids = [str(r.id) for r in recipes]
    texts = [recipe_to_embedding_text(r) for r in recipes]
    # We mirror a few hot filters into Chroma metadata so we can pre-filter
    # at the vector search level too (defense in depth — SQL is still primary).
    metadatas = [
        {
            "cuisine": r.cuisine,
            "cost_per_serving": r.cost_per_serving_gbp,
            "calories": r.calories_per_serving,
        }
        for r in recipes
    ]

    print("Generating embeddings (this may take ~30s on first run)...")
    embeddings = embed_texts(texts)

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )
    print(f"Indexed {collection.count()} recipes in Chroma at {CHROMA_DIR}")
    session.close()


if __name__ == "__main__":
    build_index()