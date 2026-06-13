"""Recipe generation pipeline.

Calls Gemini in small themed batches, validates output with Pydantic,
and writes results to JSONL.
"""

import argparse
import sys
from pathlib import Path


from pydantic import ValidationError
from generator.schema import Recipe




PROMPT_TEMPLATE = """You are generating recipes for a UK-based budget meal planning app.

THEME FOR THIS BATCH: {theme}

Generate exactly {n} diverse, realistic, home-cookable recipes that fit the theme above.
Vary the specific dishes within the theme — don't generate near-duplicates.

REQUIREMENTS:
- Ingredient prices should reflect typical UK budget supermarket prices (Aldi/Lidl level) in GBP.
- Prices are per the quantity used in the recipe (e.g. 200g chicken at £1.20).
- Steps must be specific enough to follow (minimum 10 characters each, ideally 20+).
- Use only appliances from: hob, oven, microwave, kettle, blender, air_fryer, slow_cooker, grill, none.
- Use only cuisines from: british, italian, indian, chinese, mexican, mediterranean, american, thai, japanese, middle_eastern, african, other.
- Dietary tags only from: vegetarian, vegan, gluten_free, dairy_free, nut_free, halal, kosher, low_carb, high_protein.
- Only apply dietary tags that are genuinely accurate (e.g. don't tag something with butter as vegan).
- Majority of meals do not require to meet any dietary restrictions (i.e. dietary tags can be empty).
- ABSOLUTELY no recipes with alcohol, pork.


OUTPUT FORMAT:
Return a JSON array of recipe objects with these exact fields:
title, cuisine, tags, appliances_required, servings, ingredients (with name, grams, est_price_gbp), steps, calories_per_serving, prep_minutes.

Return ONLY the JSON array. No markdown fences, no commentary.
"""


def generate_batch(n: int, theme: str) -> list[Recipe]:
    """Call an LLM with a theme and parse the response into validated Recipes."""
    from generator.providers import generate_json

    prompt = PROMPT_TEMPLATE.format(n=n, theme=theme)
    try:
        raw_recipes = generate_json(prompt)
    except Exception as e:
        print(f"  ERROR: all providers failed: {e}", file=sys.stderr)
        return []

    if not isinstance(raw_recipes, list):
        print(f"  ERROR: expected list, got {type(raw_recipes).__name__}", file=sys.stderr)
        return []

    valid_recipes = []
    for i, raw in enumerate(raw_recipes):
        try:
            recipe = Recipe(**raw)
            valid_recipes.append(recipe)
        except ValidationError as e:
            title = raw.get("title", "?") if isinstance(raw, dict) else "?"
            print(f"  Skipped '{title}': {e.errors()[0]['msg']}")

    return valid_recipes

def deduplicate_by_title(recipes: list[Recipe]) -> list[Recipe]:
    seen, unique = set(), []
    for r in recipes:
        key = r.title.lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return unique


def save_jsonl(recipes: list[Recipe], path: Path, mode: str = "w") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, mode, encoding="utf-8") as f:
        for r in recipes:
            f.write(r.model_dump_json() + "\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--theme", type=str, required=True)
    parser.add_argument("--output", type=str, required=True)
    args = parser.parse_args()

    print(f"Theme: {args.theme}")
    print(f"Requesting {args.count} recipes...")
    recipes = generate_batch(args.count, args.theme)
    recipes = deduplicate_by_title(recipes)
    save_jsonl(recipes, Path(args.output))
    print(f"Wrote {len(recipes)} recipes to {args.output}")


if __name__ == "__main__":
    main()