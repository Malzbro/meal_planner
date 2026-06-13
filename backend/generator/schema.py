"""Pydantic schemas defining the structure of a recipe.

These schemas serve two purposes:
1. Validate AI-generated output (reject malformed recipes)
2. Document the contract for downstream code (database, retrieval, API)
"""

from typing import Literal
from pydantic import BaseModel, Field, field_validator


CuisineType = Literal[
    "british", "italian", "indian", "chinese", "mexican",
    "mediterranean", "american", "thai", "japanese", "middle_eastern",
    "african", "other"
]

Appliance = Literal[
    "hob", "oven", "microwave", "kettle", "blender",
    "air_fryer", "slow_cooker", "grill", "none"
]

DietaryTag = Literal[
    "vegetarian", "vegan", "gluten_free", "dairy_free",
    "nut_free", "halal", "kosher", "low_carb", "high_protein"
]


class Ingredient(BaseModel):
    name: str = Field(..., min_length=1, description="e.g. 'chicken breast'")
    grams: float = Field(..., gt=0, description="Quantity in grams")
    est_price_gbp: float = Field(..., ge=0, description="Estimated UK supermarket price for this quantity")


class Recipe(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    cuisine: CuisineType
    tags: list[DietaryTag] = Field(default_factory=list)
    appliances_required: list[Appliance] = Field(..., min_length=1)
    servings: int = Field(..., gt=0, le=12)
    ingredients: list[Ingredient] = Field(..., min_length=2)
    steps: list[str] = Field(..., min_length=2, description="Cooking instructions, one per step")
    calories_per_serving: int = Field(..., gt=0, lt=3000)
    prep_minutes: int = Field(..., gt=0, lt=480)

    @field_validator("steps")
    @classmethod
    def steps_must_be_substantive(cls, v: list[str]) -> list[str]:
        for step in v:
            if len(step.strip()) < 10:
                raise ValueError(f"Step too short to be useful: '{step}'")
        return v

    @property
    def total_cost_gbp(self) -> float:
        return round(sum(ing.est_price_gbp for ing in self.ingredients), 2)

    @property
    def cost_per_serving_gbp(self) -> float:
        return round(self.total_cost_gbp / self.servings, 2)