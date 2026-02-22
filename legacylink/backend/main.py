"""
LegacyLink Backend - FastAPI Application
Digital immortality platform for preserving memories through AI avatars
"""
import os
import json
import uuid
import random
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel, UUID4
import asyncpg
import redis.asyncio as aioredis
import httpx

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────
app = FastAPI(
    title="LegacyLink API",
    description="Preserve memories. Transcend time.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://legacylink:legacylink_secret@postgres:5432/legacylink")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

# Demo persona IDs
DEMO_IDS = {
    "grandma_ruth": "550e8400-e29b-41d4-a716-446655440001",
    "grandpa_joe": "550e8400-e29b-41d4-a716-446655440002",
    "uncle_bob": "550e8400-e29b-41d4-a716-446655440003",
}

# ─────────────────────────────────────────────
# Database connection
# ─────────────────────────────────────────────
db_pool: Optional[asyncpg.Pool] = None
redis_client: Optional[aioredis.Redis] = None

@app.on_event("startup")
async def startup():
    global db_pool, redis_client
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
        print("✅ PostgreSQL connected")
    except Exception as e:
        print(f"⚠️  PostgreSQL connection failed: {e}")

    try:
        redis_client = aioredis.from_url(REDIS_URL)
        await redis_client.ping()
        print("✅ Redis connected")
    except Exception as e:
        print(f"⚠️  Redis connection failed: {e}")

@app.on_event("shutdown")
async def shutdown():
    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.close()

# ─────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────
class PersonCreate(BaseModel):
    name: str
    birth_year: Optional[int] = None
    birth_place: Optional[str] = None
    photos: Optional[List[str]] = []

class MemoryCreate(BaseModel):
    memory_text: str
    year_reference: Optional[int] = None
    emotion: Optional[str] = None
    audio_url: Optional[str] = None

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    emotion: str
    relevant_memories: List[Dict]
    avatar_expression: str
    voice_url: Optional[str] = None

# ─────────────────────────────────────────────
# Demo response engine (no API keys needed)
# ─────────────────────────────────────────────

DEMO_RESPONSES = {
    "550e8400-e29b-41d4-a716-446655440001": {  # Grandma Ruth
        "greetings": [
            "Oh my, hello dear! Come sit down, I just put on a fresh pot of coffee. It's so good to have someone to talk to.",
            "Well goodness, look who's here! You know, I was just thinking about you. How are you, dear heart?",
            "Hello, sweetheart! My goodness, it does my heart good to see you. Sit, sit — I made apple pie."
        ],
        "first kiss": "Oh my, that was Harold Thompson at the county fair in 1963. I was sixteen and wearing my best yellow dress — mama made it from curtain fabric, though I never told anyone that. Harold was so nervous he spilled lemonade all over me right before he kissed me! I was furious and flattered all at once.",
        "harold": "Sometimes I think about what might have been. But your grandfather was my true love. Harold couldn't dance a step and Walter — lord that man could waltz. Some people you date, and some people you build a life with. I was smart enough to choose right.",
        "grandfather": "Oh, he was something. Proposed on Christmas Eve, 1968. So nervous — this big strong veteran — he dropped the ring behind the radiator and we spent twenty minutes fishing it out with a coat hanger! When he finally put it on my finger, I cried so hard my mother thought something terrible had happened.",
        "cooking": "Every Sunday I made my grandmother's apple pie. Lard crust — people turn their noses up at lard but it makes the flakiest crust you'll ever taste. The secret is ice cold water and not overworking the dough. I taught every one of my grandchildren. Some of them even remembered to use lard!",
        "children": "The day your mother was born was the happiest day of my life. After two years of hoping and praying. She came into this world screaming and I thought — that is someone who knows what she wants. I held her and the whole world just... stopped.",
        "default": [
            "Oh, that reminds me of something. You know, every experience teaches you something if you pay attention. That's what I always told my children.",
            "Goodness, dear, I think about things like that. Life is full of surprises — the good ones and the hard ones both shape you.",
            "You know what I always say — the days are long but the years are short. Treasure every single moment, dear.",
            "Well now, let me think on that. *laughs softly* You know, at my age, the memories all sort of blend together like a good stew."
        ]
    },
    "550e8400-e29b-41d4-a716-446655440002": {  # Grandpa Joe
        "greetings": [
            "Hey, come in, come in. You want coffee? Real coffee, not that fancy stuff. Sit down.",
            "Well, look who showed up. About time. Pull up a chair, I was just watching the game.",
            "Hey kid. Good to see ya. You look thin — you eating enough?"
        ],
        "korea": "Korea, 1952. Lemme tell ya — it's cold over there in ways your bones remember forever. I was nineteen. The guys in my unit were tighter than family. Sal Mangione from the Bronx, Deke Williams from Georgia. We kept each other alive. I don't talk about what we saw. But those men. Those men I'll carry with me always.",
        "grandmother": "I met your grandmother at a USO dance in '54. Red dress. Laughing at something. I walked across that whole gymnasium — and I was not a dancer, you understand me? Stepped on her feet three times. She married me anyway. Go figure.",
        "business": "One truck, 1961. Joe Marchetti's Moving and Storage. Drove it myself for three years. There were times I wasn't sure we'd make the rent — Rose never complained, not once. By 1975 we had twelve trucks. You build something with your hands, nobody can take that away.",
        "war": "War is... it changes a man. I came back different. Everybody did. You saw things. But you also learned what you were made of. I don't regret going. I regret what it cost.",
        "default": [
            "Lemme tell ya something. Back in my day you didn't complain, you just worked harder. That's how it was.",
            "You see, the thing people don't understand is — nothing worth having comes easy. I don't care what anybody tells ya.",
            "Eh, I've seen a lot in my years. People think they got it figured out. Nobody's got it figured out. You just keep moving.",
            "*long pause* You know what, that's a good question. Sit down, let me think about it."
        ]
    },
    "550e8400-e29b-41d4-a716-446655440003": {  # Uncle Bob
        "greetings": [
            "Hey man, come in! I was just playing some old Coltrane. You want tea? I've got this incredible oolong from Taiwan.",
            "Oh hey! Far out, I was thinking about you. The universe works in mysterious ways, you know?",
            "Hey! Grab a seat. I was just watching the sunset — have you noticed how the light changes this time of year? Wild."
        ],
        "woodstock": "Man, Woodstock. August '69. I was nine — yeah yeah, too young, but my sister Carol snuck me in her VW bus. Half a million people and somehow it worked. I heard Hendrix play the Star Spangled Banner and something in my nine-year-old brain just rewired. Music was never background after that. Music was the whole point.",
        "guitar": "I learned guitar in Bali in '84, from this old man named Ketut. He didn't speak English, I didn't speak Balinese, but music doesn't need translation, you know? The ocean teaches patience. The guitar teaches humility. I stayed three months.",
        "travel": "I hitchhiked from Santa Cruz to Tierra del Fuego in 1978. Fourteen months. Just a guitar and a good attitude. People are fundamentally good, man. That's what you learn on the road. The world isn't dangerous. Fear is dangerous.",
        "music": "Music is the only language that crosses every border, man. I've played with fishermen in Portugal, monks in Thailand, kids in townships in South Africa. The chord is the same everywhere. The feeling is the same. That's not nothing — that's everything.",
        "default": [
            "Man, that's deep. I think about stuff like that on the beach sometimes. The answer is in the question, you know?",
            "Far out. You know what, everything is connected, man. The more you travel, the more you realize we're all the same story being told different ways.",
            "Like, I've been to fifty-something countries and the one thing I can tell you is — nobody actually knows what they're doing. And that's beautiful, man.",
            "*strums imaginary guitar* Yeah... yeah. That reminds me of something that happened in Morocco in '87..."
        ]
    }
}

def get_demo_response(person_id: str, query: str) -> tuple[str, str]:
    """Generate contextually appropriate demo response"""
    responses = DEMO_RESPONSES.get(person_id, {})
    if not responses:
        return "I remember so many things... what would you like to know?", "thoughtful"

    query_lower = query.lower()

    # Check greeting
    if any(w in query_lower for w in ["hello", "hi ", "hey", "how are you", "good morning", "good afternoon"]):
        greetings = responses.get("greetings", [])
        if greetings:
            return random.choice(greetings), "warm"

    # Check topic keywords
    for topic, response in responses.items():
        if topic in ["greetings", "default"]:
            continue
        if isinstance(topic, str) and topic in query_lower:
            emotion = "nostalgic" if any(w in response.lower() for w in ["remember", "was", "those days", "back"]) else "warm"
            return response, emotion

    # Default responses
    defaults = responses.get("default", ["I have so many memories to share..."])
    return random.choice(defaults), "thoughtful"


async def get_ai_response(person_id: str, query: str, memories: List[Dict], personality: Dict) -> tuple[str, str]:
    """Get AI response using OpenAI + RAG, fall back to demo"""
    if not OPENAI_API_KEY or OPENAI_API_KEY == "demo_mode":
        return get_demo_response(person_id, query)

    try:
        # Build memory context
        memory_context = "\n".join([
            f"- [{m.get('decade', 'unknown era')}] {m.get('memory_text', '')[:200]}"
            for m in memories[:5]
        ])

        name = personality.get("name", "the person")
        traits = personality.get("personality_traits", {})
        speech = personality.get("speech_patterns", {})
        values = personality.get("core_values", [])

        system_prompt = f"""You are {name}, an elderly person being interviewed about your life for a digital legacy project.

PERSONALITY TRAITS: {json.dumps(traits)}
SPEECH PATTERNS: {json.dumps(speech)}
CORE VALUES: {', '.join(values)}

RELEVANT MEMORIES FROM YOUR LIFE:
{memory_context}

Respond as this person would naturally speak - with their vocabulary, pace, and personality. Stay in character completely. 
Share specific memories and emotions. Be warm and genuine. 
If you don't have a specific memory about the topic, respond with your personality and general life philosophy.
Keep responses to 2-4 sentences unless the topic calls for more depth.
Current question: respond naturally, in first person, as if you ARE this person."""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ],
                    "temperature": 0.85,
                    "max_tokens": 300
                },
                timeout=30.0
            )
            data = response.json()
            text = data["choices"][0]["message"]["content"]
            emotion = "warm" if any(w in text.lower() for w in ["love", "happy", "joy", "wonderful"]) else "nostalgic"
            return text, emotion
    except Exception as e:
        print(f"OpenAI error: {e}, falling back to demo")
        return get_demo_response(person_id, query)

# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "LegacyLink API", "version": "1.0.0", "demo_mode": DEMO_MODE}

@app.get("/api/health")
async def health():
    db_ok = db_pool is not None
    return {"status": "healthy", "database": db_ok, "demo_mode": DEMO_MODE}

@app.get("/api/gallery")
async def get_gallery():
    """List all avatars"""
    if not db_pool:
        # Return demo data without DB
        return {"persons": [
            {"id": DEMO_IDS["grandma_ruth"], "name": "Grandma Ruth", "birth_year": 1947, "birth_place": "Columbus, Ohio", "demo_persona": True, "memory_count": 5},
            {"id": DEMO_IDS["grandpa_joe"], "name": "Grandpa Joe", "birth_year": 1943, "birth_place": "Brooklyn, New York", "demo_persona": True, "memory_count": 3},
            {"id": DEMO_IDS["uncle_bob"], "name": "Uncle Bob", "birth_year": 1960, "birth_place": "Santa Cruz, California", "demo_persona": True, "memory_count": 3},
        ]}

    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT p.id, p.name, p.birth_year, p.birth_place, p.demo_persona,
                       p.avatar_url, p.created_at,
                       COUNT(m.id) as memory_count
                FROM persons p
                LEFT JOIN memories m ON m.person_id = p.id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            """)
            return {"persons": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/persons/{person_id}")
async def get_person(person_id: str):
    """Get person details"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM persons WHERE id = $1", uuid.UUID(person_id))
            if not row:
                raise HTTPException(status_code=404, detail="Person not found")

            memories = await conn.fetch(
                "SELECT id, memory_text, emotion, year_reference, decade, themes, importance_score FROM memories WHERE person_id = $1 ORDER BY importance_score DESC",
                uuid.UUID(person_id)
            )

            data = dict(row)
            data["memories"] = [dict(m) for m in memories]
            data["memory_count"] = len(memories)
            return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/persons/create")
async def create_person(data: PersonCreate):
    """Create a new person"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO persons (name, birth_year, birth_place, photo_urls)
                VALUES ($1, $2, $3, $4)
                RETURNING id, name, birth_year, birth_place, created_at
            """, data.name, data.birth_year, data.birth_place, data.photos or [])
            return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/persons/{person_id}/memories")
async def add_memory(person_id: str, memory: MemoryCreate):
    """Add a memory to a person"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO memories (person_id, memory_text, emotion, year_reference, audio_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, memory_text, emotion, year_reference, created_at
            """, uuid.UUID(person_id), memory.memory_text, memory.emotion,
               memory.year_reference, memory.audio_url)
            return dict(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/persons/{person_id}/personality")
async def get_personality(person_id: str):
    """Return personality traits for a person"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, name, personality_traits, speech_patterns, core_values FROM persons WHERE id = $1",
                uuid.UUID(person_id)
            )
            if not row:
                raise HTTPException(status_code=404, detail="Person not found")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/{person_id}")
async def chat_with_avatar(person_id: str, request: ChatRequest) -> ChatResponse:
    """Process a chat query and return avatar response with relevant memories"""

    # Find relevant memories
    memories = []
    personality = {"name": "the avatar"}

    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                # Get personality
                person = await conn.fetchrow("SELECT * FROM persons WHERE id = $1", uuid.UUID(person_id))
                if not person:
                    raise HTTPException(status_code=404, detail="Person not found")
                personality = dict(person)

                # Simple keyword search for relevant memories
                query_words = request.query.lower().split()
                all_memories = await conn.fetch(
                    "SELECT * FROM memories WHERE person_id = $1 ORDER BY importance_score DESC LIMIT 20",
                    uuid.UUID(person_id)
                )

                # Score memories by keyword overlap
                scored = []
                for mem in all_memories:
                    text = (mem["memory_text"] or "").lower()
                    themes = " ".join(mem.get("themes") or []).lower()
                    people = " ".join(mem.get("people_mentioned") or []).lower()
                    score = sum(1 for w in query_words if w in text or w in themes or w in people)
                    scored.append((score, dict(mem)))

                scored.sort(key=lambda x: x[0], reverse=True)
                memories = [m for _, m in scored[:5]]
        except HTTPException:
            raise
        except Exception as e:
            print(f"DB error in chat: {e}")

    # Generate response
    response_text, emotion = await get_ai_response(person_id, request.query, memories, personality)

    # Map emotion to avatar expression
    expression_map = {
        "warm": "smile",
        "nostalgic": "thoughtful",
        "joyful": "happy",
        "sad": "sad",
        "proud": "proud",
        "reflective": "thoughtful",
        "funny": "laugh",
    }
    avatar_expression = expression_map.get(emotion.split("_")[0], "neutral")

    # Save conversation if DB available
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO conversations (person_id, query_text, response_text, emotion_state, session_id)
                    VALUES ($1, $2, $3, $4, $5)
                """, uuid.UUID(person_id), request.query, response_text, emotion,
                   request.session_id or str(uuid.uuid4()))
        except Exception:
            pass

    return ChatResponse(
        response=response_text,
        emotion=emotion,
        relevant_memories=[
            {"text": m.get("memory_text", "")[:100] + "..." if len(m.get("memory_text", "")) > 100 else m.get("memory_text", ""),
             "year": m.get("year_reference"),
             "emotion": m.get("emotion")}
            for m in memories[:3]
        ],
        avatar_expression=avatar_expression,
        voice_url=None
    )

@app.post("/api/voice/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe uploaded audio to text"""
    if not OPENAI_API_KEY or OPENAI_API_KEY == "demo_mode":
        # Demo: return fake transcription
        return {"text": "Tell me about your childhood.", "confidence": 0.95}

    try:
        audio_data = await file.read()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                files={"file": (file.filename, audio_data, file.content_type)},
                data={"model": "whisper-1"},
                timeout=30.0
            )
            data = response.json()
            return {"text": data.get("text", ""), "confidence": 0.95}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/conversations/{person_id}")
async def get_conversations(person_id: str, limit: int = 20):
    """Get conversation history"""
    if not db_pool:
        return {"conversations": []}

    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, query_text, response_text, emotion_state, created_at
                FROM conversations
                WHERE person_id = $1
                ORDER BY created_at DESC
                LIMIT $2
            """, uuid.UUID(person_id), limit)
            return {"conversations": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
