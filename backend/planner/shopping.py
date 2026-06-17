"""Aggregate ingredients across a week of recipes into a shopping list.

Design choices:
- Light name normalization: strip common modifiers, lowercase, singularize.
- Scale by household: recipes scale up if household > base servings.
- Group by category: simple keyword classifier with an "Other" fallback.
- Round quantities to sensible precision (no '237.451g' nonsense).
"""

import re
from collections import defaultdict
from typing import Iterable

from db.models import Recipe

# Items everyone already has — filtered out of shopping lists.
# Conservative list: only include things truly assumed in every kitchen.
PANTRY_STAPLES = {
    "water", "cold water", "hot water", "boiling water", "tap water",
    "salt", "sea salt", "table salt", "kosher salt",
    "pepper", "black pepper", "white pepper", "ground black pepper",
    "salt and pepper", "salt & pepper",
    "ice", "ice cube",
}


def _is_pantry_staple(normalized_name: str) -> bool:
    """Return True if this ingredient is something everyone has and shouldn't be on a shopping list."""
    return normalized_name in PANTRY_STAPLES

# Category keyword classifier. Order matters — more specific terms first.
CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    ("Produce", [
        "onion", "garlic", "potato", "carrot", "tomato", "pepper", "spinach",
        "lettuce", "cabbage", "cucumber", "courgette", "aubergine", "broccoli",
        "cauliflower", "celery", "leek", "mushroom", "lemon", "lime", "ginger",
        "chilli", "chili", "apple", "banana", "lettuce", "kale", "rocket",
        "coriander", "parsley", "basil", "mint", "thyme", "rosemary", "fresh ",
        "vegetable", "fruit",
    ]),
    ("Meat & Fish", [
        "chicken", "beef", "pork", "lamb", "mince", "sausage", "bacon",
        "ham", "turkey", "fish", "salmon", "cod", "tuna", "prawn", "shrimp",
        "mackerel", "sardine", "anchovy",
    ]),
    ("Dairy & Eggs", [
        "milk", "cream", "butter", "cheese", "yogurt", "yoghurt", "egg",
        "mozzarella", "feta", "parmesan", "cheddar", "halloumi", "ricotta",
    ]),
    ("Pantry", [
        "rice", "pasta", "noodle", "flour", "bread", "oats", "lentil", "bean",
        "chickpea", "couscous", "quinoa", "stock", "broth", "oil", "vinegar",
        "soy sauce", "tomato sauce", "tinned", "canned", "honey", "sugar",
        "syrup", "tortilla", "wrap", "pita",
    ]),
    ("Spices & Seasoning", [
        "salt", "pepper", "paprika", "cumin", "turmeric", "cinnamon", "curry",
        "spice", "seasoning", "herb", "bay leaf", "oregano", "garam masala",
        "chilli powder", "chili powder", "mustard",
    ]),
]


def _normalize_name(name: str) -> str:
    """Light normalization for aggregation. Keeps 'chicken breast' separate
    from 'chicken thigh' but combines variants of the same thing."""
    n = name.lower().strip()
    # Strip leading "fresh", "frozen", "tinned", "canned"
    n = re.sub(r"^(fresh|frozen|tinned|canned|dried)\s+", "", n)
    # Strip trailing modifiers in parens or after comma: "Onion (diced)" -> "onion"
    n = re.sub(r"\s*[\(,].*$", "", n)
    # Strip preparation verbs at end: "onion diced" -> "onion"
    n = re.sub(r"\s+(diced|chopped|sliced|minced|grated|peeled|crushed)$", "", n)
    # Collapse whitespace
    n = re.sub(r"\s+", " ", n)
    # Trim trailing 's' for crude singularization (cherries→cherrie, but good enough)
    if n.endswith("s") and not n.endswith("ss") and len(n) > 3:
        n = n[:-1]
    return n.strip()


def _classify(name: str) -> str:
    """Categorize an ingredient by keyword. Falls back to 'Other'."""
    name_lower = name.lower()
    for category, keywords in CATEGORY_KEYWORDS:
        for kw in keywords:
            if kw in name_lower:
                return category
    return "Other"


def _round_quantity(grams: float) -> float:
    """Round to sensible precision. Big quantities to nearest 50g, small to nearest 5g."""
    if grams >= 500:
        return round(grams / 50) * 50
    elif grams >= 100:
        return round(grams / 10) * 10
    else:
        return round(grams / 5) * 5


def aggregate_shopping_list(
    recipes_with_servings: Iterable[tuple[Recipe, int]],
    household_size: int,
) -> dict:
    """Aggregate ingredients across recipes into a categorized shopping list.

    Args:
        recipes_with_servings: iterable of (Recipe, base_servings_of_that_recipe).
        household_size: how many people are eating.

    Returns a dict with:
        - categories: list of {name, items}, ordered for shopping flow
        - total_ingredients: count of unique ingredient lines
        - meals_count: count of meals contributing
    """
    # Aggregate by normalized name
    aggregated: dict[str, dict] = defaultdict(lambda: {
        "display_name": "",
        "total_grams": 0.0,
        "estimated_cost": 0.0,
        "appears_in": [],
    })

    for recipe, base_servings in recipes_with_servings:
        scale = max(1.0, household_size / base_servings)
        for ing in recipe.ingredients:
            key = _normalize_name(ing.name)
            if not key or _is_pantry_staple(key):
                continue
            entry = aggregated[key]
            # Use the first-seen display name (already title-cased typically)
            if not entry["display_name"]:
                entry["display_name"] = ing.name.strip()
            entry["total_grams"] += ing.grams * scale
            entry["estimated_cost"] += ing.est_price_gbp * scale
            if recipe.title not in entry["appears_in"]:
                entry["appears_in"].append(recipe.title)

    # Group by category
    by_category: dict[str, list] = defaultdict(list)
    for key, data in aggregated.items():
        category = _classify(data["display_name"])
        by_category[category].append({
            "name": data["display_name"],
            "grams": _round_quantity(data["total_grams"]),
            "estimated_cost_gbp": round(data["estimated_cost"], 2),
            "appears_in": data["appears_in"],
        })

    # Sort items alphabetically within each category
    for items in by_category.values():
        items.sort(key=lambda x: x["name"].lower())

    # Order categories in shopping-flow order
    category_order = ["Produce", "Meat & Fish", "Dairy & Eggs", "Pantry", "Spices & Seasoning", "Other"]
    ordered_categories = [
        {"name": cat, "items": by_category[cat]}
        for cat in category_order
        if cat in by_category
    ]

    total_items = sum(len(items) for items in by_category.values())
    meals_count = sum(1 for _ in recipes_with_servings) if isinstance(recipes_with_servings, list) else None

    return {
        "categories": ordered_categories,
        "total_ingredients": total_items,
        "estimated_total_cost_gbp": round(
            sum(item["estimated_cost_gbp"] for cat in ordered_categories for item in cat["items"]),
            2,
        ),
    }