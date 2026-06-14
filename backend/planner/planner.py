"""Weekly meal planner.

Given a PlanRequest, returns a PlanResponse with N meals that:
- Fit within the weekly budget (hard constraint)
- Match dietary/appliance constraints (hard, via SQL filter)
- Are near the calorie target (soft, via scoring)
- Reflect the user's preference text (soft, via RAG)
- Have reasonable cuisine diversity (soft, via penalty)

Algorithm: greedy selection with a single repair pass.
"""

from sqlalchemy.orm import Session

from db.models import Recipe
from rag.search import hybrid_search
from planner.schemas import PlanRequest, PlanResponse, PlannedMeal
from planner.scoring import fitness_score


# How much to penalize picking a cuisine we've already used. 0 = no penalty, 1 = strong penalty.
DIVERSITY_PENALTY = 0.15

# Maximum candidates to fetch — bigger pool = better choice, but slower.
CANDIDATE_POOL_SIZE = 80


def _cost_for_household(recipe: Recipe, household_size: int) -> float:
    """Scale recipe cost up if household is bigger than its base servings."""
    scale = max(1.0, household_size / recipe.servings)
    return round(recipe.total_cost_gbp * scale, 2)


def plan_week(session: Session, request: PlanRequest) -> PlanResponse:
    # Step 1: candidate pool via hybrid search.
    candidates_with_scores = hybrid_search(
        session,
        query=request.preference_text,
        required_tags=request.required_tags or None,
        excluded_appliances=request.excluded_appliances or None,
        cuisines=request.preferred_cuisines or None,
        top_k=CANDIDATE_POOL_SIZE,
    )

    if not candidates_with_scores:
        return PlanResponse(
            meals=[],
            total_cost_gbp=0.0,
            budget_gbp=request.weekly_budget_gbp,
            budget_utilization=0.0,
            avg_calories_per_serving=0.0,
            cuisine_diversity=0,
            warnings=["No recipes matched the given constraints. Try relaxing dietary or appliance filters."],
        )

    # Step 2: score each candidate.
    scored: list[tuple[Recipe, float, float]] = []  # (recipe, fitness, relevance)
    for recipe, relevance in candidates_with_scores:
        fit = fitness_score(recipe, request, relevance=relevance)
        scored.append((recipe, fit, relevance))

    # Step 3: greedy selection with budget-pressure weighting.
    # As budget gets tight, prefer cheaper meals more aggressively.
    selected: list[tuple[Recipe, float]] = []
    used_cuisines: dict[str, int] = {}
    spent = 0.0
    warnings: list[str] = []

    remaining_pool = list(scored)

    while len(selected) < request.meals_per_week and remaining_pool:
        meals_remaining = request.meals_per_week - len(selected)
        budget_remaining = request.weekly_budget_gbp - spent
        target_per_meal = budget_remaining / meals_remaining if meals_remaining > 0 else 0

        # Rerank pool by *adjusted* fitness that penalises being over target_per_meal.
        def adjusted_score(item):
            recipe, fit, _ = item
            meal_cost = _cost_for_household(recipe, request.household_size)
            # Penalty grows as cost exceeds the per-meal target.
            cost_pressure = max(0.0, (meal_cost - target_per_meal) / max(target_per_meal, 1.0))
            cuisine_pen = DIVERSITY_PENALTY * used_cuisines.get(recipe.cuisine, 0)
            return fit - cost_pressure * 0.5 - cuisine_pen

        remaining_pool.sort(key=adjusted_score, reverse=True)

        # Pick the best candidate that actually fits the remaining budget.
        picked_index = None
        for i, (recipe, fit, relevance) in enumerate(remaining_pool):
            meal_cost = _cost_for_household(recipe, request.household_size)
            if spent + meal_cost <= request.weekly_budget_gbp:
                picked_index = i
                break

        if picked_index is None:
            break  # nothing left fits

        recipe, _, relevance = remaining_pool.pop(picked_index)
        meal_cost = _cost_for_household(recipe, request.household_size)
        selected.append((recipe, relevance))
        used_cuisines[recipe.cuisine] = used_cuisines.get(recipe.cuisine, 0) + 1
        spent += meal_cost

    if len(selected) < request.meals_per_week:
        warnings.append(
            f"Could only fit {len(selected)} meals within budget — "
            f"try increasing budget or relaxing filters."
        )

    # Step 4: build response.
    meals = []
    for recipe, relevance in selected:
        meal_cost = _cost_for_household(recipe, request.household_size)
        meals.append(
            PlannedMeal(
                recipe_id=recipe.id,
                title=recipe.title,
                cuisine=recipe.cuisine,
                cost_per_serving_gbp=recipe.cost_per_serving_gbp,
                total_cost_gbp=meal_cost,
                calories_per_serving=recipe.calories_per_serving,
                relevance_score=round(relevance, 3),
            )
        )

    total_cost = round(sum(m.total_cost_gbp for m in meals), 2)
    avg_cal = (
        round(sum(m.calories_per_serving for m in meals) / len(meals), 1)
        if meals else 0.0
    )

    return PlanResponse(
        meals=meals,
        total_cost_gbp=total_cost,
        budget_gbp=request.weekly_budget_gbp,
        budget_utilization=round(total_cost / request.weekly_budget_gbp, 3),
        avg_calories_per_serving=avg_cal,
        cuisine_diversity=len(set(m.cuisine for m in meals)),
        warnings=warnings,
    )