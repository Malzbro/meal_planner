"""Show that hybrid search actually works."""

from db.session import SessionLocal
from rag.search import hybrid_search


session = SessionLocal()


def show(title: str, results):
    print(f"\n--- {title} ---")
    if not results:
        print("  (no results)")
        return
    for recipe, score in results:
        print(f"  [{score:.2f}]  £{recipe.cost_per_serving_gbp:.2f}  |  {recipe.calories_per_serving} kcal  |  {recipe.title}")


# Pure semantic — no SQL filters
results = hybrid_search(session, "cosy warming food for a cold winter evening", top_k=5)
show("Cosy warming food (no filters)", results)

# Pure semantic — different vibe
results = hybrid_search(session, "fresh light summer lunch", top_k=5)
show("Fresh light summer lunch (no filters)", results)

# Semantic + SQL filters
results = hybrid_search(
    session,
    "comforting bean stew",
    max_cost_per_serving=1.50,
    required_tags=["vegetarian"],
    top_k=5,
)
show("Comforting bean stew, vegetarian, under £1.50/serving", results)

# SQL only (empty query)
results = hybrid_search(
    session,
    "",
    required_tags=["high_protein"],
    excluded_appliances=["oven"],
    top_k=5,
)
show("Empty query: high-protein, no oven (SQL only)", results)

session.close()