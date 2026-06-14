"""Score how well a recipe fits a planning request.

Higher score = better fit. The score guides greedy selection.

Components:
- Calorie fit (closer to target = better)
- Cost efficiency (cheaper per serving = better, but not the only factor)
- Relevance (from RAG, if a query was used)
- Cuisine preference (boost preferred cuisines)
"""

from db.models import Recipe
from planner.schemas import PlanRequest


def fitness_score(recipe: Recipe, request: PlanRequest, relevance: float = 1.0) -> float:
    """Compute a recipe's fitness for this request. Higher is better."""
    score = 0.0

    # 1. Calorie fit: peaks at the target, falls off either side.
    cal_distance = abs(recipe.calories_per_serving - request.target_calories_per_serving)
    # Normalize: 200 kcal off target -> 0.5 score, 400+ -> 0
    cal_score = max(0.0, 1.0 - (cal_distance / 400.0))
    score += cal_score * 0.35

    # 2. Cost efficiency: cheaper is better, but only weakly (we filter for budget separately).
    # Reward sub-£1.50 per serving; neutral above.
    cost_score = max(0.0, min(1.0, (2.5 - recipe.cost_per_serving_gbp) / 2.5))
    score += cost_score * 0.20

    # 3. Semantic relevance: from the hybrid search.
    score += relevance * 0.30

    # 4. Cuisine preference boost.
    if request.preferred_cuisines and recipe.cuisine in request.preferred_cuisines:
        score += 0.15

    return score