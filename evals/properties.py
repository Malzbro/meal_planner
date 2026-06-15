"""Quality properties that we check each plan against.

Each function returns (passed: bool, detail: str).
Detail is a short human-readable explanation, useful for the report.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy.orm import Session
from db.models import Recipe
from planner.schemas import PlanRequest, PlanResponse


CALORIE_TOLERANCE = 0.20      # plans must average within ±20% of target
DIVERSITY_MIN_CUISINES = 3    # 7-meal plans should have at least 3 cuisines
DIVERSITY_MIN_MEALS = 6       # only enforce diversity if plan has 6+ meals


def check_budget(request: PlanRequest, plan: PlanResponse) -> tuple[bool, str]:
    if plan.total_cost_gbp <= request.weekly_budget_gbp:
        return True, f"£{plan.total_cost_gbp:.2f} of £{request.weekly_budget_gbp:.2f}"
    over = plan.total_cost_gbp - request.weekly_budget_gbp
    return False, f"Over budget by £{over:.2f}"


def check_calorie_target(request: PlanRequest, plan: PlanResponse) -> tuple[bool, str]:
    if not plan.meals:
        return False, "no meals to evaluate"
    target = request.target_calories_per_serving
    actual = plan.avg_calories_per_serving
    deviation = abs(actual - target) / target
    if deviation <= CALORIE_TOLERANCE:
        return True, f"{actual:.0f} kcal vs {target} target ({deviation*100:.0f}% off)"
    return False, f"{actual:.0f} kcal vs {target} target ({deviation*100:.0f}% off, tolerance {CALORIE_TOLERANCE*100:.0f}%)"


def check_dietary_compliance(
    request: PlanRequest, plan: PlanResponse, session: Session
) -> tuple[bool, str]:
    if not request.required_tags:
        return True, "no dietary requirements"
    if not plan.meals:
        return False, "no meals to evaluate"

    required = set(request.required_tags)
    violations: list[str] = []

    for meal in plan.meals:
        recipe = session.get(Recipe, meal.recipe_id)
        if recipe is None:
            violations.append(f"recipe {meal.recipe_id} not found")
            continue
        recipe_tags = {t.name for t in recipe.tags}
        missing = required - recipe_tags
        if missing:
            violations.append(f"'{meal.title}' missing {sorted(missing)}")

    if violations:
        return False, f"{len(violations)} violations: " + "; ".join(violations[:3])
    return True, f"all {len(plan.meals)} meals satisfy {sorted(required)}"


def check_appliance_compliance(
    request: PlanRequest, plan: PlanResponse, session: Session
) -> tuple[bool, str]:
    if not request.excluded_appliances:
        return True, "no appliance exclusions"
    if not plan.meals:
        return False, "no meals to evaluate"

    excluded = set(request.excluded_appliances)
    violations: list[str] = []

    for meal in plan.meals:
        recipe = session.get(Recipe, meal.recipe_id)
        if recipe is None:
            continue
        recipe_appliances = {a.name for a in recipe.appliances}
        forbidden = excluded & recipe_appliances
        if forbidden:
            violations.append(f"'{meal.title}' uses {sorted(forbidden)}")

    if violations:
        return False, f"{len(violations)} violations: " + "; ".join(violations[:3])
    return True, f"all {len(plan.meals)} meals avoid {sorted(excluded)}"


def check_diversity(request: PlanRequest, plan: PlanResponse) -> tuple[bool, str]:
    # Only enforce diversity when the plan is large enough to expect it
    if len(plan.meals) < DIVERSITY_MIN_MEALS:
        return True, f"diversity not enforced for {len(plan.meals)}-meal plans"
    if plan.cuisine_diversity >= DIVERSITY_MIN_CUISINES:
        return True, f"{plan.cuisine_diversity} distinct cuisines"
    return False, f"only {plan.cuisine_diversity} cuisines (expected ≥ {DIVERSITY_MIN_CUISINES})"