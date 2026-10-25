from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Material, User
from app.schemas import MaterialAskOutput, MaterialOut, MaterialSearchInput, MaterialSearchHit, MaterialTextInput
from app.security import get_current_user
from app.services.llm_guard import run_llm_call
from app.services.llm_service import answer_from_material_async
from app.services.question_service import index_material, search_materials
from app.services.rate_limit import limit_by_user

router = APIRouter(prefix="/questions/materials", tags=["materials"])


def material_out(material: Material) -> MaterialOut:
    return MaterialOut(id=material.id, title=material.title, filename=material.filename,
                       chunkCount=len(material.chunks))


@router.post("/text", response_model=MaterialOut, status_code=201,
             dependencies=[Depends(limit_by_user("upload", settings.rate_limit_upload_per_minute))],
             summary="Add study text and index it for semantic search")
async def add_text(body: MaterialTextInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    material = await run_in_threadpool(index_material, db, user, body.title, body.content)
    return material_out(material)


@router.post("/upload", response_model=MaterialOut, status_code=201,
             dependencies=[Depends(limit_by_user("upload", settings.rate_limit_upload_per_minute))],
             summary="Upload a PDF, Markdown, or text study file")
async def upload_material(file: UploadFile = File(...), title: str | None = Form(None),
                         db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    filename = (file.filename or "").replace("\\", "/").split("/")[-1]
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in {"txt", "md", "markdown", "pdf"}:
        raise HTTPException(status_code=415, detail="Supported files: PDF, TXT, and Markdown")
    raw = await file.read(settings.material_max_upload_bytes + 1)
    if len(raw) > settings.material_max_upload_bytes:
        raise HTTPException(status_code=413, detail="Uploaded file exceeds the size limit")
    if extension == "pdf":
        from io import BytesIO
        from pypdf import PdfReader
        try:
            reader = PdfReader(BytesIO(raw))
            content = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise HTTPException(status_code=422, detail="Could not read this PDF") from exc
    else:
        try:
            content = raw.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=422, detail="Text files must use UTF-8 encoding") from exc
    material = await run_in_threadpool(index_material, db, user, title or filename, content, filename)
    return material_out(material)


@router.get("", response_model=list[MaterialOut], summary="List your indexed study materials")
def list_materials(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    materials = db.query(Material).filter(Material.owner_id == user.id).order_by(Material.id.desc()).all()
    return [material_out(material) for material in materials]


@router.delete("/{material_id}", status_code=204, summary="Delete a study material and its index")
def delete_material(material_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    material = db.query(Material).filter(Material.id == material_id, Material.owner_id == user.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    db.delete(material)
    db.commit()


def to_hit(chunk, score: float) -> MaterialSearchHit:
    return MaterialSearchHit(materialId=chunk.material_id, title=chunk.material.title,
                             chunkId=chunk.id, content=chunk.content, similarity=score)


@router.post("/ask", response_model=MaterialAskOutput, summary="Ask a question and get a conversational answer",
             dependencies=[Depends(limit_by_user("ask", settings.rate_limit_llm_per_minute))])
async def ask(request: Request, body: MaterialSearchInput, db: Session = Depends(get_db),
              user: User = Depends(get_current_user)):
    hits = await run_in_threadpool(search_materials, db, user, body.query, body.materialIds, body.limit)
    sources = [to_hit(chunk, score) for chunk, score in hits]
    if not sources:
        return MaterialAskOutput(
            answer="I couldn't find anything about that in your study materials. Try adding the material first, or rephrase your question.",
            sources=[],
        )
    context = "\n\n".join(f"[{hit.title}]\n{hit.content}" for hit in sources)
    answer = await run_llm_call(request, lambda: answer_from_material_async(body.query, context))
    return MaterialAskOutput(answer=answer, sources=sources)
