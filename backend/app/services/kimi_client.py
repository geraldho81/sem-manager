from openai import AsyncOpenAI
from app.config import settings
from typing import Dict, Any, Optional, List
import json
import asyncio
import re
import logging

logger = logging.getLogger(__name__)


def repair_json(text: str) -> str:
    """Attempt to repair malformed JSON from LLM responses."""
    if not text:
        return "{}"

    start = text.find('{')
    if start == -1:
        return "{}"

    depth = 0
    end = -1
    in_string = False
    escape_next = False

    for i, char in enumerate(text[start:], start):
        if escape_next:
            escape_next = False
            continue
        if char == '\\' and in_string:
            escape_next = True
            continue
        if char == '"' and not escape_next:
            in_string = not in_string
            continue
        if in_string:
            continue
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    if end == -1:
        json_text = text[start:]
        open_braces = json_text.count('{') - json_text.count('}')
        open_brackets = json_text.count('[') - json_text.count(']')

        quote_count = 0
        for i, char in enumerate(json_text):
            if char == '"' and (i == 0 or json_text[i-1] != '\\'):
                quote_count += 1

        if quote_count % 2 == 1:
            json_text += '"'

        json_text += ']' * open_brackets
        json_text += '}' * open_braces
    else:
        json_text = text[start:end]

    json_text = re.sub(r',\s*([}\]])', r'\1', json_text)
    json_text = re.sub(r'"\s*\n\s*"', '",\n"', json_text)
    json_text = re.sub(r'}\s*\n\s*{', '},\n{', json_text)
    json_text = re.sub(r']\s*\n\s*"', '],\n"', json_text)

    return json_text


class KimiClient:
    """Client for Kimi API (Moonshot AI) - OpenAI compatible."""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.KIMI_API_KEY,
            base_url=settings.KIMI_API_BASE,
        )

    async def chat(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        use_large_model: bool = False,
        temperature: Optional[float] = None,
        response_format: str = "json",
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        """Send a chat completion request to Kimi API."""
        model = settings.KIMI_MODEL_THINKING if use_large_model else settings.KIMI_MODEL_STANDARD

        # kimi-k2.5 thinking model only allows temperature=1
        # But if caller explicitly passes a temperature, respect it (e.g. non-thinking K2.5 use)
        if temperature is None:
            temperature = 1.0 if use_large_model else 0.7

        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        last_error = None
        for attempt in range(max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    response_format={"type": "json_object"} if response_format == "json" else None,
                )

                content = response.choices[0].message.content

                if response_format == "json":
                    parse_attempts = [
                        lambda c: json.loads(c),
                        lambda c: json.loads(repair_json(c)),
                    ]

                    for parse_fn in parse_attempts:
                        try:
                            return parse_fn(content)
                        except (json.JSONDecodeError, ValueError):
                            continue

                    logger.warning(f"Failed to parse JSON response. Content preview: {content[:300]}...")
                    return {}

                return {"text": content}

            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    await asyncio.sleep(settings.RETRY_DELAY * (2 ** attempt))
                continue

        raise last_error

    async def chat_with_context(
        self,
        messages: List[Dict[str, str]],
        use_large_model: bool = False,
        temperature: float = 0.7,
    ) -> str:
        """Send a multi-turn conversation to Kimi API."""
        model = settings.KIMI_MODEL_THINKING if use_large_model else settings.KIMI_MODEL_STANDARD

        if use_large_model:
            temperature = 1.0

        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
        )

        return response.choices[0].message.content
