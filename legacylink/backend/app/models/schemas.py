from pydantic import BaseModel, UUID4, Field
from typing import List, Optional, Dict

class PersonBase(BaseModel):
    name: str
    birth_year: Optional[int] = None
    birth_place: Optional[str] = None
    photo_urls: List[str] = Field(default_factory=list)

class PersonCreate(PersonBase):
    pass

class Person(PersonBase):
    id: UUID4
    demo_persona: bool = False
    memory_count: int = 0

    class Config:
        from_attributes = True

class MemoryBase(BaseModel):
    memory_text: str
    year_reference: Optional[int] = None
    emotion: Optional[str] = None
    audio_url: Optional[str] = None

class MemoryCreate(MemoryBase):
    pass

class Memory(MemoryBase):
    id: UUID4
    person_id: UUID4

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    emotion: str
    relevant_memories: List[Dict]
    avatar_expression: str
    voice_url: Optional[str] = None
