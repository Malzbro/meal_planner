"""Build the text representation of a recipe for embedding.

We embed identity (what is this dish), not implementation (how to cook it).
Steps and exact quantities are noise for semantic search.
"""

from db.models import Recipe


def recipe_to_embedding_text(recipe: Recipe) -> str:
    """Compose a focused text representation for the embedding model."""
    parts = [recipe.title]

    if recipe.cuisine:
        parts.append(f"Cuisine: {recipe.cuisine}")

    if recipe.tags:
        tag_names = sorted(t.name for t in recipe.tags)
        parts.append(f"Dietary: {', '.join(tag_names)}")

    if recipe.appliances:
        appliance_names = sorted(a.name for a in recipe.appliances)
        parts.append(f"Cooked with: {', '.join(appliance_names)}")

    # Top ingredients by weight — these define the dish's identity.
    if recipe.ingredients:
        top = sorted(recipe.ingredients, key=lambda i: i.grams, reverse=True)[:6]
        ingredient_summary = ", ".join(i.name for i in top)
        parts.append(f"Key ingredients: {ingredient_summary}")

    parts.append(f"Prep time: {recipe.prep_minutes} minutes")

    return ". ".join(parts)