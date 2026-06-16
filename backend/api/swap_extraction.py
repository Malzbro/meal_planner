"""Extract structured exclusions from a free-text swap reason.

The user types something like "I don't want chicken" or "no beans, too spicy".
We send that to an LLM with a strict JSON schema and get back:
  - excluded_ingredients: list of ingredient names to filter out
  - sentiment_terms: list of soft preferences (e.g. "milder", "less spicy")

The structured output is enforced by the model's JSON mode + a parse-and-validate
pass. If extraction fails or returns nothing, the caller falls back to plain
semantic search.
"""

from typing import Optional
from pydantic import BaseModel, Field, ValidationError

from generator.providers import generate_json


class SwapExtraction(BaseModel):
    excluded_ingredients: list[str] = Field(
        default_factory=list,
        description="Specific ingredients the user wants to avoid (lowercase, singular where possible)"
    )
    sentiment_terms: list[str] = Field(
        default_factory=list,
        description="Soft preferences to bias semantic search (e.g. 'milder', 'lighter', 'simpler')"
    )


EXTRACTION_PROMPT = """You are extracting structured constraints from a user's
free-text reason for swapping a meal in a meal planner.

User's reason: "{reason}"

Return a JSON object with exactly these fields:
- "excluded_ingredients": array of ingredient names the user wants to AVOID
  (e.g. if they say "I don't want chicken" -> ["chicken"])
  - Use the simplest singular form (chicken, not chickens; rice, not rice noodles)
  - Only include ingredients explicitly rejected, not loosely associated ones
  - Return [] if no explicit exclusions

- "sentiment_terms": array of short phrases describing the *positive* direction
  the user wants to move in (e.g. if they say "too spicy" -> ["milder", "less spicy"])
  - These will be used to bias a semantic search toward what they DO want
  - Return [] if none

Examples:
"I don't want chicken" -> {{"excluded_ingredients": ["chicken"], "sentiment_terms": []}}
"too spicy" -> {{"excluded_ingredients": [], "sentiment_terms": ["milder", "less spicy"]}}
"no beans, want something lighter" -> {{"excluded_ingredients": ["beans"], "sentiment_terms": ["lighter"]}}
"this is gross" -> {{"excluded_ingredients": [], "sentiment_terms": []}}

Return ONLY the JSON object, no markdown fences or commentary."""


def extract_swap_constraints(reason: str) -> Optional[SwapExtraction]:
    """Parse a free-text swap reason into structured exclusions.

    Returns None if extraction fails for any reason — caller should fall back
    to plain semantic search.
    """
    reason = (reason or "").strip()
    if not reason:
        return None

    try:
        raw = generate_json(EXTRACTION_PROMPT.format(reason=reason), expect="object")
    except Exception as e:
        print(f"  [extraction] LLM call failed: {e}")
        return None

    if not isinstance(raw, dict):
        print(f"  [extraction] expected dict, got {type(raw).__name__}")
        return None

    try:
        extracted = SwapExtraction(**raw)
    except ValidationError as e:
        print(f"  [extraction] schema validation failed: {e.errors()[0]['msg']}")
        return None

    # Normalize: lowercase, deduplicate, strip whitespace
    extracted.excluded_ingredients = list({
        ing.lower().strip() for ing in extracted.excluded_ingredients if ing and ing.strip()
    })
    extracted.sentiment_terms = [
        t.strip() for t in extracted.sentiment_terms if t and t.strip()
    ]

    return extracted