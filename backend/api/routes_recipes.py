"""GET /recipes/{id} — fetch a single recipe with full details."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.deps import get_db
from db.queries import get_recipe_by_id


router = APIRouter(tags=["recipes"])


class IngredientOut(BaseModel):
    name: str
    grams: float
    est_price_gbp: float


class StepOut(BaseModel):
    position: int
    content: str


class RecipeDetail(BaseModel):
    id: int
    title: str
    cuisine: str
    servings: int
    calories_per_serving: int
    prep_minutes: int
    total_cost_gbp: float
    cost_per_serving_gbp: float
    tags: list[str]
    appliances: list[str]
    ingredients: list[IngredientOut]
    steps: list[StepOut]


@router.get("/recipes/{recipe_id}", response_model=RecipeDetail)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)) -> RecipeDetail:
    recipe = get_recipe_by_id(db, recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail=f"Recipe {recipe_id} not found")

    return RecipeDetail(
        id=recipe.id,
        title=recipe.title,
        cuisine=recipe.cuisine,
        servings=recipe.servings,
        calories_per_serving=recipe.calories_per_serving,
        prep_minutes=recipe.prep_minutes,
        total_cost_gbp=recipe.total_cost_gbp,
        cost_per_serving_gbp=recipe.cost_per_serving_gbp,
        tags=[t.name for t in recipe.tags],
        appliances=[a.name for a in recipe.appliances],
        ingredients=[
            IngredientOut(name=i.name, grams=i.grams, est_price_gbp=i.est_price_gbp)
            for i in recipe.ingredients
        ],
        steps=[StepOut(position=s.position, content=s.content) for s in recipe.steps],
    )