import httpx
from app.core.config import settings

JINA_API_URL = "https://api.jina.ai/v1/embeddings"
JINA_MODEL = "jina-embeddings-v3"
VECTOR_DIM = 1024

async def get_embedding(text: str) -> list[float]:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            JINA_API_URL,
            headers={
                "Authorization": f"Bearer {settings.JINA_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": JINA_MODEL, "input": [text]},
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()["data"][0]["embedding"]

async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            JINA_API_URL,
            headers={
                "Authorization": f"Bearer {settings.JINA_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": JINA_MODEL, "input": texts},
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()["data"]
        return [item["embedding"] for item in sorted(data, key=lambda x: x["index"])]