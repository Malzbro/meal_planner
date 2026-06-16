"""POST /swap — replace a single meal in a plan with an alternative.

Uses LLM-based structured extraction to interpret the user's swap reason:
- Excluded ingredients are filtered out in code (handles negation correctly)
- Sentiment terms are appended to the semantic query (biases the search)
- If extraction fails, falls back to plain semantic search
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import get_db
from api.swap_extraction import extract_swap_constraints
from db.queries import get_recipe_by_id, filter_by_excluded_ingredients
from rag.search import hybrid_search
from planner.schemas import PlannedMeal, PlanRequest


router = APIRouter(tags=["swap"])


class SwapRequest(BaseModel):
    original_recipe_id: int
    reason: str = Field(default="", max_length=300)
    plan_context: PlanRequest


@router.post("/swap", response_model=PlannedMeal)
def swap_meal(request: SwapRequest, db: Session = Depends(get_db)) -> PlannedMeal:
    original = get_recipe_by_id(db, request.original_recipe_id)
    if original is None:
        raise HTTPException(status_code=404, detail="Original recipe not found")

    # Step 1: extract structured constraints from the user's reason.
    extraction = extract_swap_constraints(request.reason)
    excluded_ingredients: list[str] = []
    sentiment_terms: list[str] = []

    if extraction is not None:
        excluded_ingredients = extraction.excluded_ingredients
        sentiment_terms = extraction.sentiment_terms
        if excluded_ingredients or sentiment_terms:
            print(f"  [swap] extracted: excluded={excluded_ingredients}, terms={sentiment_terms}")

    # Always include the original ingredients we're moving away from
    # (e.g. swapping chicken curry — bias against chicken even if user didn't say so)
    original_main_ingredients = sorted(
        original.ingredients, key=lambda i: i.grams, reverse=True
    )[:2]

    # Step 2: build the semantic query.
    # Combine the original plan's preference text with positive sentiment terms.
    # Sentiment terms ("milder", "lighter") bias toward what they DO want.
    query_parts = []
    if request.plan_context.preference_text:
        query_parts.append(request.plan_context.preference_text)
    if sentiment_terms:
        query_parts.append(" ".join(sentiment_terms))
    if not query_parts:
        query_parts.append(f"meal like {original.title} but different")
    combined_query = " ".join(query_parts)

    # Step 3: candidate pool via hybrid search. Over-fetch since we'll filter.
    candidates_with_scores = hybrid_search(
        db,
        query=combined_query,
        required_tags=request.plan_context.required_tags or None,
        excluded_appliances=request.plan_context.excluded_appliances or None,
        top_k=40,
    )

    # Step 4: drop the original itself.
    candidates_with_scores = [
        (r, s) for r, s in candidates_with_scores
        if r.id != request.original_recipe_id
    ]

    # Step 5: apply ingredient-based exclusion (this is the negation fix).
    if excluded_ingredients:
        before = len(candidates_with_scores)
        recipes_only = [r for r, _ in candidates_with_scores]
        kept_recipes = filter_by_excluded_ingredients(recipes_only, excluded_ingredients)
        kept_ids = {r.id for r in kept_recipes}
        candidates_with_scores = [(r, s) for r, s in candidates_with_scores if r.id in kept_ids]
        print(f"  [swap] ingredient filter: {before} -> {len(candidates_with_scores)} candidates")

    if not candidates_with_scores:
        raise HTTPException(
            status_code=404,
            detail="No suitable alternative found. Try relaxing your constraints."
        )

    # Step 6: pick the top candidate.
    recipe, relevance = candidates_with_scores[0]

    # Scale cost for the requesting household.
    scale = max(1.0, request.plan_context.household_size / recipe.servings)
    total_cost = round(recipe.total_cost_gbp * scale, 2)

    return PlannedMeal(
        recipe_id=recipe.id,
        title=recipe.title,
        cuisine=recipe.cuisine,
        cost_per_serving_gbp=recipe.cost_per_serving_gbp,
        total_cost_gbp=total_cost,
        calories_per_serving=recipe.calories_per_serving,
        relevance_score=round(relevance, 3),
    )