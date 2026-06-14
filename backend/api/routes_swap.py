"""POST /swap — replace a single meal in a plan with an alternative."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import get_db
from db.queries import get_recipe_by_id
from rag.search import hybrid_search
from planner.schemas import PlannedMeal, PlanRequest


router = APIRouter(tags=["swap"])


class SwapRequest(BaseModel):
    original_recipe_id: int
    reason: str = Field(default="", max_length=300, description="Why the user wants to swap (e.g. 'too spicy', 'want pasta instead')")
    plan_context: PlanRequest


@router.post("/swap", response_model=PlannedMeal)
def swap_meal(request: SwapRequest, db: Session = Depends(get_db)) -> PlannedMeal:
    original = get_recipe_by_id(db, request.original_recipe_id)
    if original is None:
        raise HTTPException(status_code=404, detail="Original recipe not found")

    # Combine the original plan's preference text with the swap reason.
    # This lets the user steer: "too spicy" pulls semantically mild alternatives.
    combined_query = f"{request.plan_context.preference_text} {request.reason}".strip()
    if not combined_query:
        combined_query = f"meal like {original.title} but different"

    candidates = hybrid_search(
        db,
        query=combined_query,
        required_tags=request.plan_context.required_tags or None,
        excluded_appliances=request.plan_context.excluded_appliances or None,
        top_k=20,
    )

    # Filter out the original itself.
    candidates = [(r, score) for r, score in candidates if r.id != request.original_recipe_id]

    if not candidates:
        raise HTTPException(
            status_code=404,
            detail="No suitable alternative found. Try relaxing filters."
        )

    # Pick the top candidate. Could be more sophisticated (avoid recipes already
    # in the plan), but this is the right starting point.
    recipe, relevance = candidates[0]

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