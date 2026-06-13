"""Recipe generation pipeline.

Calls Gemini in small batches, asks for JSON output matching our schema,
validates every recipe, deduplicates by title, and writes the result to disk.

Usage:
    python -m generator.generate --count 10 --output ../data/raw/batch_001.jsonl
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from pydantic import ValidationError
import google.generativeai as genai

from generator.schema import Recipe


load_dotenv(dotenv_path="../.env")

API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    print("ERROR: GOOGLE_API_KEY not set in .env", file=sys.stderr)
    sys.exit(1)

genai.configure(api_key=API_KEY)


PROMPT_TEMPLATE = """You are generating recipes for a UK-based budget meal planning app.

Generate exactly {n} diverse, realistic, home-cookable recipes.

REQUIREMENTS:
- Cuisines should vary across the batch (don't generate 5 Italian recipes in a row).
- Ingredient prices should reflect typical UK budget supermarket prices (Aldi/Lidl level) in GBP.
- Prices are per the quantity used in the recipe (e.g. 200g chicken at £1.20, not per kg).
- Steps must be specific enough to follow (minimum 10 characters each).
- Use only appliances from: hob, oven, microwave, kettle, blender, air_fryer, slow_cooker, grill, none.
- Use only cuisines from: british, italian, indian, chinese, mexican, mediterranean, american, thai, japanese, middle_eastern, african, other.
- Dietary tags only from: vegetarian, vegan, gluten_free, dairy_free, nut_free, halal, kosher, low_carb, high_protein.
- Majority of meals do not require to meet any dietary restrictions (i.e. dietary tags can be empty).
- ABSOLUTELY no recipes with alcohol, pork.


OUTPUT FORMAT:
Return a JSON array of recipe objects. Each object must have these exact fields:
- title (string, 3-100 chars)
- cuisine (string from the list above)
- tags (array of dietary tag strings, can be empty)
- appliances_required (array of appliance strings, at least one)
- servings (integer, 1-12)
- ingredients (array of objects with name, grams, est_price_gbp)
- steps (array of strings, at least 2)
- calories_per_serving (integer, less than 3000)
- prep_minutes (integer, less than 480)

Return ONLY the JSON array. No markdown fences, no commentary, no preamble.
"""


def generate_batch(n: int) -> list[Recipe]:
    """Call Gemini once and parse the response into validated Recipe objects."""
    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        generation_config={"response_mime_type": "application/json"},
    )
    prompt = PROMPT_TEMPLATE.format(n=n)
    print(f"Requesting {n} recipes from Gemini...")
    response = model.generate_content(prompt)

    try:
        raw_recipes = json.loads(response.text)
    except json.JSONDecodeError as e:
        print(f"ERROR: Gemini returned invalid JSON: {e}", file=sys.stderr)
        print(f"Raw response was:\n{response.text[:500]}", file=sys.stderr)
        return []

    valid_recipes = []
    for i, raw in enumerate(raw_recipes):
        try:
            recipe = Recipe(**raw)
            valid_recipes.append(recipe)
        except ValidationError as e:
            print(f"  Skipping recipe {i} ('{raw.get('title', '?')}'): validation failed")
            print(f"    {e.errors()[0]['msg']}")

    print(f"Validated {len(valid_recipes)}/{len(raw_recipes)} recipes")
    return valid_recipes


def deduplicate_by_title(recipes: list[Recipe]) -> list[Recipe]:
    """Remove recipes with duplicate titles (case-insensitive)."""
    seen = set()
    unique = []
    for r in recipes:
        key = r.title.lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(r)
    if len(unique) < len(recipes):
        print(f"Removed {len(recipes) - len(unique)} duplicate titles")
    return unique


def save_jsonl(recipes: list[Recipe], path: Path) -> None:
    """Write recipes one-per-line as JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for r in recipes:
            f.write(r.model_dump_json() + "\n")
    print(f"Wrote {len(recipes)} recipes to {path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=10, help="How many recipes to request")
    parser.add_argument("--output", type=str, required=True, help="Path to output .jsonl file")
    args = parser.parse_args()

    recipes = generate_batch(args.count)
    recipes = deduplicate_by_title(recipes)
    save_jsonl(recipes, Path(args.output))


if __name__ == "__main__":
    main()