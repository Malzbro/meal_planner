"""Test cases for the meal planner evaluation harness.

Each case is a (name, PlanRequest) pair. Names should be descriptive
so the eval report reads clearly.

The set is designed to cover:
- Range of budgets (tight, comfortable, generous)
- Range of household sizes
- Common dietary constraints (vegetarian, vegan, gluten-free, high-protein)
- Common appliance exclusions (no oven, minimal equipment)
- Preference text variety (specific cuisines, vibes, none)
- Edge cases (very low budget, conflicting constraints)
"""

import sys
from pathlib import Path

# Allow imports from the backend folder
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from planner.schemas import PlanRequest


TEST_CASES: list[tuple[str, PlanRequest]] = [
    # Budget range
    ("Tight student budget, solo, no constraints",
     PlanRequest(weekly_budget_gbp=12, household_size=1, target_calories_per_serving=600)),

    ("Modest budget, family of 4",
     PlanRequest(weekly_budget_gbp=35, household_size=4, target_calories_per_serving=550)),

    ("Generous budget, couple",
     PlanRequest(weekly_budget_gbp=60, household_size=2, target_calories_per_serving=650)),

    # Dietary constraints
    ("Vegetarian, modest budget, couple",
     PlanRequest(weekly_budget_gbp=25, household_size=2, target_calories_per_serving=600,
                 required_tags=["vegetarian"])),

    ("Vegan, comfortable budget, solo",
     PlanRequest(weekly_budget_gbp=20, household_size=1, target_calories_per_serving=550,
                 required_tags=["vegan"])),

    ("Gluten-free, family of 3",
     PlanRequest(weekly_budget_gbp=30, household_size=3, target_calories_per_serving=600,
                 required_tags=["gluten_free"])),

    ("High-protein, solo, calorie surplus",
     PlanRequest(weekly_budget_gbp=25, household_size=1, target_calories_per_serving=750,
                 required_tags=["high_protein"])),

    ("Vegetarian and gluten-free, modest",
     PlanRequest(weekly_budget_gbp=20, household_size=2, target_calories_per_serving=550,
                 required_tags=["vegetarian", "gluten_free"])),

    # Appliance constraints
    ("No oven (student kitchen)",
     PlanRequest(weekly_budget_gbp=18, household_size=1, target_calories_per_serving=600,
                 excluded_appliances=["oven"])),

    ("Minimal kitchen (no oven, no air fryer, no slow cooker)",
     PlanRequest(weekly_budget_gbp=20, household_size=2, target_calories_per_serving=600,
                 excluded_appliances=["oven", "air_fryer", "slow_cooker"])),

    # Preference text variety
    ("Comforting winter food",
     PlanRequest(weekly_budget_gbp=30, household_size=3, target_calories_per_serving=600,
                 preference_text="cosy comforting food for cold evenings")),

    ("Quick weeknight dinners",
     PlanRequest(weekly_budget_gbp=25, household_size=2, target_calories_per_serving=600,
                 preference_text="quick easy weeknight dinners under 30 minutes")),

    ("Asian-inspired",
     PlanRequest(weekly_budget_gbp=30, household_size=2, target_calories_per_serving=600,
                 preference_text="Asian-inspired stir fries and noodles")),

    ("Hearty protein-rich meals",
     PlanRequest(weekly_budget_gbp=35, household_size=2, target_calories_per_serving=700,
                 preference_text="hearty protein-rich meals with meat")),

    # Compound constraints
    ("Vegetarian, no oven, comforting",
     PlanRequest(weekly_budget_gbp=22, household_size=2, target_calories_per_serving=600,
                 required_tags=["vegetarian"], excluded_appliances=["oven"],
                 preference_text="comforting one-pot meals")),

    ("High-protein, no oven, quick",
     PlanRequest(weekly_budget_gbp=28, household_size=2, target_calories_per_serving=650,
                 required_tags=["high_protein"], excluded_appliances=["oven"],
                 preference_text="quick high-protein dinners")),

    # Larger households
    ("Family of 5, hearty meals",
     PlanRequest(weekly_budget_gbp=50, household_size=5, target_calories_per_serving=600,
                 preference_text="hearty family meals")),

    ("Family of 6, budget-conscious",
     PlanRequest(weekly_budget_gbp=45, household_size=6, target_calories_per_serving=550)),

    # Edge cases
    ("Very low budget (should warn)",
     PlanRequest(weekly_budget_gbp=8, household_size=1, target_calories_per_serving=500)),

    ("Low calorie target (300 kcal)",
     PlanRequest(weekly_budget_gbp=25, household_size=1, target_calories_per_serving=350,
                 preference_text="light meals")),

    # Stress tests — deliberately designed to find the planner's limits

    ("Stress: very tight calorie target with conflicting prefs",
     PlanRequest(weekly_budget_gbp=25, household_size=1, target_calories_per_serving=400,
                 preference_text="hearty filling meals")),

    ("Stress: vegan + gluten-free + no oven + tight budget",
     PlanRequest(weekly_budget_gbp=15, household_size=1, target_calories_per_serving=600,
                 required_tags=["vegan", "gluten_free"], excluded_appliances=["oven"])),

    ("Stress: high-protein + vegetarian (often conflicts in dataset)",
     PlanRequest(weekly_budget_gbp=25, household_size=2, target_calories_per_serving=600,
                 required_tags=["vegetarian", "high_protein"])),

    ("Stress: very high calorie target",
     PlanRequest(weekly_budget_gbp=30, household_size=1, target_calories_per_serving=1000,
                 preference_text="big hearty filling meals")),

    ("Stress: cuisine preference text vs strict tags",
     PlanRequest(weekly_budget_gbp=20, household_size=1, target_calories_per_serving=600,
                 required_tags=["vegan"], preference_text="hearty British comfort food with meat")),

    ("Stress: family of 6 on very tight budget",
     PlanRequest(weekly_budget_gbp=25, household_size=6, target_calories_per_serving=500)),
]