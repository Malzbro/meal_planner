"""Hybrid search: SQL filters + vector similarity ranking.

Pattern:
  1. SQL narrows the candidate pool to recipes that match hard constraints.
  2. Vector search ranks those candidates by semantic similarity to the query.

Never the other way around — SQL is the source of truth for constraints;
embeddings are for "what does this remind us of?"
"""

from sqlalchemy.orm import Session

from db.queries import search_recipes
from db.models import Recipe
from rag.embedder import embed_query
from rag.index import get_collection


def hybrid_search(
    session: Session,
    query: str,
    *,
    max_cost_per_serving: float | None = None,
    min_calories: int | None = None,
    max_calories: int | None = None,
    required_tags: list[str] | None = None,
    excluded_appliances: list[str] | None = None,
    cuisines: list[str] | None = None,
    top_k: int = 10,
) -> list[tuple[Recipe, float]]:
    """Return (Recipe, similarity_score) tuples, ranked by relevance to query."""

    # Step 1: SQL pre-filter — get the candidate pool.
    # We pull a wide net (limit=500) because we'll re-rank below.
    candidates = search_recipes(
        session,
        max_cost_per_serving=max_cost_per_serving,
        min_calories=min_calories,
        max_calories=max_calories,
        required_tags=required_tags,
        excluded_appliances=excluded_appliances,
        cuisines=cuisines,
        limit=500,
    )

    if not candidates:
        return []

    # If no semantic query, just return SQL results in their natural order.
    if not query.strip():
        return [(r, 1.0) for r in candidates[:top_k]]

    # Step 2: Vector search, restricted to the candidate IDs.
    candidate_ids = [str(r.id) for r in candidates]
    collection = get_collection()
    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, len(candidate_ids)),
        where={"$or": [{"$and": []}, {}]} if False else None,  # placeholder
        # Restrict to the SQL-approved candidates
        ids=candidate_ids if hasattr(collection, "_validate_ids") else None,
    )

    # Chroma's filter-by-id behavior varies by version. Most reliable approach:
    # query without ID restriction, then drop results not in the candidate set.
    if not results["ids"][0]:
        # Re-query without ID restriction
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k * 5, collection.count()),  # over-fetch for filtering
        )

    candidate_id_set = set(candidate_ids)
    ranked: list[tuple[Recipe, float]] = []
    recipe_by_id = {str(r.id): r for r in candidates}

    for chroma_id, distance in zip(results["ids"][0], results["distances"][0]):
        if chroma_id in candidate_id_set:
            similarity = 1.0 - distance  # cosine distance -> similarity
            ranked.append((recipe_by_id[chroma_id], similarity))
            if len(ranked) >= top_k:
                break

    return ranked