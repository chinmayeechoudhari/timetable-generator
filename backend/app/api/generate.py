from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import get_db

router = APIRouter()


@router.get("/validate")
async def validate_preflight(db: Session = Depends(get_db)):
    """Run pre-generation checks and return a structured report."""
    from app.solver.validator import run_preflight_checks
    return run_preflight_checks(db)


@router.post("/generate")
async def generate_timetable(db: Session = Depends(get_db)):
    try:
        from app.solver.tasks import run_solver_task
        task = run_solver_task.delay()
        return {"task_id": task.id, "status": "running"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/generate/status/{task_id}")
async def get_generate_status(task_id: str, db: Session = Depends(get_db)):
    try:
        from celery.result import AsyncResult
        from app.solver.tasks import celery_app
        task = AsyncResult(task_id, app=celery_app)
        if task.ready():
            result = task.result
            # If solver failed, enrich the response with preflight diagnosis
            if isinstance(result, dict) and result.get("status") == "no_solution":
                from app.solver.validator import run_preflight_checks
                diagnosis = run_preflight_checks(db)
                result["diagnosis"] = diagnosis
            return {"status": "done", "result": result}
        return {"status": "running", "task_id": task_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/timetable")
async def get_timetable(db: Session = Depends(get_db)):
    try:
        from app.models.models import Timetable
        entries = db.query(Timetable).all()
        return entries
    except Exception as e:
        return {"error": str(e)}