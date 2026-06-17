"""POST /shopping-list — aggregate ingredients across a list of recipes."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import get_db
from db.queries import get_recipe_by_id
from planner.shopping import aggregate_shopping_list


router = APIRouter(tags=["shopping"])


class ShoppingListRequest(BaseModel):
    recipe_ids: list[int] = Field(..., min_length=1, max_length=21)
    household_size: int = Field(..., gt=0, le=12)


class ShoppingItem(BaseModel):
    name: str
    grams: float
    estimated_cost_gbp: float
    appears_in: list[str]


class ShoppingCategory(BaseModel):
    name: str
    items: list[ShoppingItem]


class ShoppingListResponse(BaseModel):
    categories: list[ShoppingCategory]
    total_ingredients: int
    estimated_total_cost_gbp: float


@router.post("/shopping-list", response_model=ShoppingListResponse)
def make_shopping_list(
    request: ShoppingListRequest,
    db: Session = Depends(get_db),
) -> ShoppingListResponse:
    recipes_with_servings = []
    for recipe_id in request.recipe_ids:
        recipe = get_recipe_by_id(db, recipe_id)
        if recipe is None:
            raise HTTPException(status_code=404, detail=f"Recipe {recipe_id} not found")
        recipes_with_servings.append((recipe, recipe.servings))

    result = aggregate_shopping_list(recipes_with_servings, request.household_size)
    return ShoppingListResponse(**result)