from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import get_db
from app.models.models import Timetable
from celery.result import AsyncResult

router = APIRouter()


@router.post("/generate")
async def generate_timetable(db: Session = Depends(get_db)):
    from app.solver.tasks import run_solver_task
    task = run_solver_task.delay()
    return {"task_id": task.id, "status": "running"}


@router.get("/generate/status/{task_id}")
async def get_generate_status(task_id: str):
    from app.solver.tasks import celery_app
    task = AsyncResult(task_id, app=celery_app)
    if task.ready():
        return {"status": "done", "result": task.result}
    return {"status": "running", "task_id": task_id}


@router.get("/timetable")
async def get_timetable(db: Session = Depends(get_db)):
    entries = db.query(Timetable).all()
    return entries