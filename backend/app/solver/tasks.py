from celery import Celery
import os
from dotenv import load_dotenv
load_dotenv()

celery_app = Celery(
    'timetable',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
)

@celery_app.task(bind=True)
def run_solver_task(self):
    from app.core.config import SessionLocal
    from app.solver.solver import build_and_solve
    db = SessionLocal()
    try:
        result = build_and_solve(db)
        return result
    except Exception as e:
        return {'status': 'error', 'message': str(e)}
    finally:
        db.close()
