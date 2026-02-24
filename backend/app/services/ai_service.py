import json
import logging
from abc import ABC, abstractmethod

from app.config import get_settings
from app.utils.prompts import BOLETO_EXTRACTION_SYSTEM_PROMPT, BOLETO_EXTRACTION_USER_PROMPT

logger = logging.getLogger(__name__)
settings = get_settings()


class AIProvider(ABC):
    @abstractmethod
    async def extract_boleto_data(self, content: str, subject: str, sender: str, date: str) -> dict:
        pass


class OpenAIProvider(AIProvider):
    async def extract_boleto_data(self, content: str, subject: str, sender: str, date: str) -> dict:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        user_prompt = BOLETO_EXTRACTION_USER_PROMPT.format(
            subject=subject, sender=sender, date=date, content=content
        )
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": BOLETO_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(response.choices[0].message.content)


class GeminiProvider(AIProvider):
    async def extract_boleto_data(self, content: str, subject: str, sender: str, date: str) -> dict:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        user_prompt = BOLETO_EXTRACTION_USER_PROMPT.format(
            subject=subject, sender=sender, date=date, content=content
        )
        full_prompt = f"{BOLETO_EXTRACTION_SYSTEM_PROMPT}\n\n{user_prompt}"
        response = await model.generate_content_async(full_prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)


class ClaudeProvider(AIProvider):
    async def extract_boleto_data(self, content: str, subject: str, sender: str, date: str) -> dict:
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        user_prompt = BOLETO_EXTRACTION_USER_PROMPT.format(
            subject=subject, sender=sender, date=date, content=content
        )
        response = await client.messages.create(
            model="claude-3-5-haiku-latest",
            max_tokens=1024,
            system=BOLETO_EXTRACTION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)


_providers: dict[str, type[AIProvider]] = {
    "openai": OpenAIProvider,
    "gemini": GeminiProvider,
    "claude": ClaudeProvider,
}


def get_ai_provider() -> AIProvider:
    provider_name = settings.AI_PROVIDER.lower()
    provider_class = _providers.get(provider_name)
    if not provider_class:
        raise ValueError(f"Unknown AI provider: {provider_name}. Supported: {list(_providers.keys())}")
    return provider_class()


async def extract_boleto_data(content: str, subject: str = "", sender: str = "", date: str = "") -> dict:
    provider = get_ai_provider()
    provider_names = list(_providers.keys())
    current_idx = provider_names.index(settings.AI_PROVIDER.lower())

    for i in range(len(provider_names)):
        idx = (current_idx + i) % len(provider_names)
        name = provider_names[idx]
        try:
            p = _providers[name]()
            result = await p.extract_boleto_data(content, subject, sender, date)
            logger.info(f"Successfully extracted boleto data using {name}")
            return result
        except Exception as e:
            logger.warning(f"AI provider {name} failed: {e}")
            continue

    raise RuntimeError("All AI providers failed to extract boleto data")
