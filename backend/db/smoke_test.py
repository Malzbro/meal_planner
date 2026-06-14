"""Quick sanity checks for the database and query layer."""

from db.session import SessionLocal
from db.queries import search_recipes, count_recipes


session = SessionLocal()

print(f"Total recipes: {count_recipes(session)}")

print("\n--- Vegetarian recipes under £1.50/serving (top 5) ---")
results = search_recipes(
    session,
    max_cost_per_serving=1.50,
    required_tags=["vegetarian"],
    limit=5,
)
for r in results:
    print(f"  £{r.cost_per_serving_gbp:.2f}  |  {r.calories_per_serving} kcal  |  {r.title}")

print("\n--- High-protein recipes, 400-700 kcal, no oven required (top 5) ---")
results = search_recipes(
    session,
    min_calories=400,
    max_calories=700,
    required_tags=["high_protein"],
    excluded_appliances=["oven"],
    limit=5,
)
for r in results:
    print(f"  £{r.cost_per_serving_gbp:.2f}  |  {r.calories_per_serving} kcal  |  {r.title}")

print("\n--- One recipe's full details ---")
results = search_recipes(session, limit=1)
if results:
    r = results[0]
    print(f"Title: {r.title}")
    print(f"Cuisine: {r.cuisine}")
    print(f"Tags: {[t.name for t in r.tags]}")
    print(f"Appliances: {[a.name for a in r.appliances]}")
    print(f"Ingredients: {len(r.ingredients)}, Steps: {len(r.steps)}")

session.close()