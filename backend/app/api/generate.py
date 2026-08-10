import uuid
import concurrent.futures
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import get_db, SessionLocal
from app.solver.solver import build_and_solve

router = APIRouter()

# In-memory store for solver background jobs
TASKS = {}
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

def run_solver_job(task_id: str):
    TASKS[task_id] = {"status": "running"}
    db = SessionLocal()
    try:
        result = build_and_solve(db)
        TASKS[task_id] = {"status": "done", "result": result}
    except Exception as e:
        TASKS[task_id] = {"status": "done", "result": {"status": "error", "message": str(e)}}
    finally:
        db.close()

@router.get("/validate")
async def validate_preflight(db: Session = Depends(get_db)):
    """Run pre-generation checks and return a structured report."""
    from app.solver.validator import run_preflight_checks
    return run_preflight_checks(db)

@router.post("/generate")
async def generate_timetable():
    try:
        print("[INFO] Dispatching background solver task")
        task_id = str(uuid.uuid4())
        TASKS[task_id] = {"status": "running"}
        executor.submit(run_solver_job, task_id)
        return {
            "task_id": task_id,
            "status": "running"
        }
    except Exception as e:
        print("[ERROR] Generate error:", str(e))
        return {"status": "error", "message": str(e)}

@router.get("/generate/status/{task_id}")
async def get_generate_status(task_id: str, db: Session = Depends(get_db)):
    try:
        task_data = TASKS.get(task_id)
        if not task_data:
            # Fallback check Celery if present
            try:
                from celery.result import AsyncResult
                from app.solver.tasks import celery_app
                task = AsyncResult(task_id, app=celery_app)
                if task.ready():
                    result = task.result
                    if isinstance(result, dict) and result.get("status") == "no_solution":
                        from app.solver.validator import run_preflight_checks
                        result["diagnosis"] = run_preflight_checks(db)
                    return {"status": "done", "result": result}
            except Exception:
                pass
            return {"status": "error", "message": "Task not found"}

        if task_data.get("status") == "done":
            result = task_data.get("result")
            if isinstance(result, dict) and result.get("status") == "no_solution":
                from app.solver.validator import run_preflight_checks
                result["diagnosis"] = run_preflight_checks(db)
            return {"status": "done", "result": result}

        return task_data
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/timetable")
async def get_timetable(db: Session = Depends(get_db)):
    try:
        from app.models.models import Timetable
        entries = db.query(Timetable).all()
        return [
            {
                "timetable_id": e.timetable_id,
                "class_id":     e.class_id,
                "subject_id":   e.subject_id,
                "teacher_id":   e.teacher_id,
                "slot_id":      e.slot_id,
                "room_id":      e.room_id,
            }
            for e in entries
        ]
    except Exception as e:
        return {"error": str(e)}