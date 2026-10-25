from fastapi import APIRouter

from app.services.llm_service import status

router = APIRouter(prefix="/llm", tags=["LLM service"])


@router.get("/status", summary="Check the configured in-process LLM provider")
def llm_status():
    return status()
