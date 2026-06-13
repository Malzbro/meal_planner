"""LLM provider abstraction with automatic fallback.

The rest of the codebase calls `generate_json(prompt)` and doesn't care
which provider answers. If the primary (Gemini) hits a rate limit, we
fall back to Groq automatically.
"""

import json
import os
import sys
import time
from typing import Any

from dotenv import load_dotenv
import google.generativeai as genai
from groq import Groq

load_dotenv(dotenv_path="../.env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GOOGLE_API_KEY:
    print("ERROR: GOOGLE_API_KEY missing", file=sys.stderr)
    sys.exit(1)
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY missing", file=sys.stderr)
    sys.exit(1)

genai.configure(api_key=GOOGLE_API_KEY)
_groq = Groq(api_key=GROQ_API_KEY)


def _call_gemini(prompt: str) -> Any:
    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        generation_config={"response_mime_type": "application/json"},
    )
    response = model.generate_content(prompt)
    return json.loads(response.text)


def _call_groq(prompt: str) -> Any:
    response = _groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that always returns valid JSON. Never include markdown fences, commentary, or preamble — only the raw JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    text = response.choices[0].message.content
    parsed = json.loads(text)
    # Groq with json_object mode returns an object; our prompts expect an array.
    # The model usually wraps in {"recipes": [...]} — handle both shapes.
    if isinstance(parsed, dict):
        for key in ("recipes", "data", "items", "results"):
            if key in parsed and isinstance(parsed[key], list):
                return parsed[key]
        # If it's a dict but not wrapped how we expect, treat its values list
        for value in parsed.values():
            if isinstance(value, list):
                return value
    return parsed


def generate_json(prompt: str) -> Any:
    """Try Gemini first, fall back to Groq on rate limit or error."""
    try:
        return _call_gemini(prompt)
    except Exception as e:
        err_str = str(e).lower()
        if "429" in err_str or "quota" in err_str or "exhausted" in err_str:
            print("  [fallback] Gemini rate-limited, trying Groq...")
        else:
            print(f"  [fallback] Gemini error ({type(e).__name__}), trying Groq...")
        time.sleep(1)
        return _call_groq(prompt)