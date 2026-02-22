from fastapi import APIRouter
from app.api.endpoints import person, chat, gallery

api_router = APIRouter()

api_router.include_router(gallery.router, prefix="/gallery", tags=["gallery"])
api_router.include_router(person.router, prefix="/persons", tags=["persons"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
