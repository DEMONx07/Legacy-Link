import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.models.schemas import ChatRequest, ChatResponse
from app.core.database import db
from app.services.ai_engine import AIEngine
from app.core.config import settings
import httpx

router = APIRouter()

@router.post("/{person_id}", response_model=ChatResponse)
async def chat_with_avatar(person_id: str, request: ChatRequest):
    memories = []
    personality = {"name": "the avatar"}
    if db.pool:
        try:
            async with db.pool.acquire() as conn:
                person = await conn.fetchrow("SELECT * FROM persons WHERE id = $1", uuid.UUID(person_id))
                if not person: raise HTTPException(status_code=404, detail="Person not found")
                personality = dict(person)
                query_words = request.query.lower().split()
                all_memories = await conn.fetch(
                    "SELECT * FROM memories WHERE person_id = $1 ORDER BY importance_score DESC LIMIT 20",
                    uuid.UUID(person_id)
                )
                scored = []
                for mem in all_memories:
                    text = (mem["memory_text"] or "").lower()
                    score = sum(1 for w in query_words if w in text)
                    scored.append((score, dict(mem)))
                scored.sort(key=lambda x: x[0], reverse=True)
                memories = [m for _, m in scored[:5]]
        except HTTPException: raise
        except Exception as e: print(f"DB error in chat: {e}")

    response_text, emotion = await AIEngine.get_ai_response(person_id, request.query, memories, personality)
    
    expression_map = {"warm": "smile", "nostalgic": "thoughtful", "joyful": "happy", "sad": "sad", "proud": "proud"}
    avatar_expression = expression_map.get(emotion.split("_")[0], "neutral")

    if db.pool:
        try:
            async with db.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO conversations (person_id, query_text, response_text, emotion_state, session_id)
                    VALUES ($1, $2, $3, $4, $5)
                """, uuid.UUID(person_id), request.query, response_text, emotion,
                   request.session_id or str(uuid.uuid4()))
        except Exception: pass

    return ChatResponse(
        response=response_text,
        emotion=emotion,
        relevant_memories=[{"text": m.get("memory_text", "")[:100], "year": m.get("year_reference"), "emotion": m.get("emotion")} for m in memories[:3]],
        avatar_expression=avatar_expression
    )

@router.post("/voice/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "demo_mode":
        return {"text": "Tell me about your childhood.", "confidence": 0.95}
    try:
        audio_data = await file.read()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                files={"file": (file.filename, audio_data, file.content_type)},
                data={"model": "whisper-1"},
                timeout=30.0
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
