"""Request and response schemas for the meal planner.

Kept separate from the DB models so the API contract is independent
of the database layout (good practice — lets either evolve without
breaking the other).
"""

from typing import Literal
from pydantic import BaseModel, Field


CuisineFilter = Literal[
    "british", "italian", "indian", "chinese", "mexican",
    "mediterranean", "american", "thai", "japanese", "middle_eastern",
    "african", "other"
]

DietaryTag = Literal[
    "vegetarian", "vegan", "gluten_free", "dairy_free",
    "nut_free", "halal", "kosher", "low_carb", "high_protein"
]

Appliance = Literal[
    "hob", "oven", "microwave", "kettle", "blender",
    "air_fryer", "slow_cooker", "grill", "none"
]


class PlanRequest(BaseModel):
    weekly_budget_gbp: float = Field(..., gt=0, le=500)
    household_size: int = Field(..., gt=0, le=12)
    target_calories_per_serving: int = Field(default=600, gt=200, lt=2000)
    required_tags: list[DietaryTag] = Field(default_factory=list)
    excluded_appliances: list[Appliance] = Field(default_factory=list)
    preferred_cuisines: list[CuisineFilter] = Field(default_factory=list)
    preference_text: str = Field(
        default="",
        max_length=500,
        description="Free-form preferences ('we like spicy food', 'lots of veg')"
    )
    meals_per_week: int = Field(default=7, gt=0, le=21)


class PlannedMeal(BaseModel):
    recipe_id: int
    title: str
    cuisine: str
    cost_per_serving_gbp: float
    total_cost_gbp: float
    calories_per_serving: int
    relevance_score: float


class PlanResponse(BaseModel):
    meals: list[PlannedMeal]
    total_cost_gbp: float
    budget_gbp: float
    budget_utilization: float  # 0-1, how much of budget was used
    avg_calories_per_serving: float
    cuisine_diversity: int     # number of distinct cuisines in the plan
    warnings: list[str] = Field(default_factory=list)