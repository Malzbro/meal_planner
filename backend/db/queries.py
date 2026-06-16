"""Query layer: typed functions for the planner and API to call.

Everything that touches the database should go through here.
Keeps SQL out of endpoint code and makes queries reusable + testable.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_

from db.models import Recipe, Tag, Appliance


def get_recipe_by_id(session: Session, recipe_id: int) -> Recipe | None:
    return session.get(Recipe, recipe_id)


def search_recipes(
    session: Session,
    *,
    max_cost_per_serving: float | None = None,
    min_calories: int | None = None,
    max_calories: int | None = None,
    required_tags: list[str] | None = None,      # recipe MUST have all these tags
    excluded_appliances: list[str] | None = None, # recipe must NOT require any of these
    cuisines: list[str] | None = None,            # if set, recipe must be one of these
    limit: int = 100,
) -> list[Recipe]:
    """Filter recipes by the constraints the planner cares about."""
    q = session.query(Recipe)

    if max_cost_per_serving is not None:
        q = q.filter(Recipe.cost_per_serving_gbp <= max_cost_per_serving)
    if min_calories is not None:
        q = q.filter(Recipe.calories_per_serving >= min_calories)
    if max_calories is not None:
        q = q.filter(Recipe.calories_per_serving <= max_calories)
    if cuisines:
        q = q.filter(Recipe.cuisine.in_(cuisines))
    if required_tags:
        # Recipe must have ALL required tags. We do this with a subquery count.
        for tag_name in required_tags:
            q = q.filter(Recipe.tags.any(Tag.name == tag_name))
    if excluded_appliances:
        q = q.filter(~Recipe.appliances.any(Appliance.name.in_(excluded_appliances)))

    return q.limit(limit).all()


def count_recipes(session: Session) -> int:
    return session.query(Recipe).count()

def filter_by_excluded_ingredients(
    recipes: list[Recipe], excluded: list[str]
) -> list[Recipe]:
    """Filter out recipes whose ingredient list contains any excluded term.

    Matches are substring-based (case-insensitive) so 'chicken' catches
    'chicken breast', 'chicken stock', etc. This is intentional: if the user
    says no chicken, they almost certainly mean no chicken stock either.
    """
    if not excluded:
        return recipes

    excluded_lower = [e.lower() for e in excluded]
    filtered = []
    for recipe in recipes:
        ingredient_names = " ".join(i.name.lower() for i in recipe.ingredients)
        if not any(term in ingredient_names for term in excluded_lower):
            filtered.append(recipe)
    return filtered