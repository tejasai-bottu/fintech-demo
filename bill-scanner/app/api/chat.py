from fastapi import APIRouter
from pydantic import BaseModel
from services.openrouter_extractor import OPENROUTER_API_KEY, OPENROUTER_URL, OPENROUTER_MODEL, HEADERS
import requests
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    prompt: str
    max_tokens: int = 200


@router.post("/chat")
def chat(req: ChatRequest):
    messages = [
        {"role": "user", "content": req.prompt}
    ]

    data = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": req.max_tokens
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=HEADERS,
            data=json.dumps(data),
            timeout=20
        )
        response.raise_for_status()
        result = response.json()
        ai_message = result["choices"][0]["message"]["content"]
        return {"response": ai_message}

    except requests.exceptions.Timeout:
        logger.error("OpenRouter chat request timed out")
        return {"response": "Error: Request timed out"}
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenRouter chat request failed: {e}")
        return {"response": f"Error: {str(e)}"}
    except (KeyError, IndexError) as e:
        logger.error(f"Unexpected response structure: {e}")
        return {"response": "Error: Unexpected API response"}
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        return {"response": f"Error: {str(e)}"}
