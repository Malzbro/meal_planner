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


def _call_groq(prompt: str, expect: str = "auto") -> Any:
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

    # If caller wants an object back, hand it over as-is (or unwrap a singleton list).
    if expect == "object":
        if isinstance(parsed, list) and len(parsed) == 1 and isinstance(parsed[0], dict):
            return parsed[0]
        return parsed

    # If caller wants a list back, unwrap common dict-wrappers.
    if expect == "list":
        if isinstance(parsed, dict):
            for key in ("recipes", "data", "items", "results"):
                if key in parsed and isinstance(parsed[key], list):
                    return parsed[key]
            for value in parsed.values():
                if isinstance(value, list):
                    return value
        return parsed

    # Auto mode (legacy): unwrap dicts into lists, the original behavior.
    if isinstance(parsed, dict):
        for key in ("recipes", "data", "items", "results"):
            if key in parsed and isinstance(parsed[key], list):
                return parsed[key]
        for value in parsed.values():
            if isinstance(value, list):
                return value
    return parsed


def generate_json(prompt: str, expect: str = "auto") -> Any:
    """Try Gemini first, fall back to Groq on rate limit or error.

    Args:
        prompt: the user prompt to send.
        expect: "object" (dict expected), "list" (list expected), or "auto"
            (legacy behavior, unwraps dicts into lists for backwards compat).
    """
    try:
        return _call_gemini(prompt)
    except Exception as e:
        err_str = str(e).lower()
        if "429" in err_str or "quota" in err_str or "exhausted" in err_str:
            print("  [fallback] Gemini rate-limited, trying Groq...")
        else:
            print(f"  [fallback] Gemini error ({type(e).__name__}), trying Groq...")
        import time
        time.sleep(1)
        return _call_groq(prompt, expect=expect)