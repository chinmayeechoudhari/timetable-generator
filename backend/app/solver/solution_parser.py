from app.models.models import Timetable
from sqlalchemy.orm import Session

def parse_and_save_solution(solver, assign, db: Session):
    """Read solved BoolVars and write Timetable rows to DB"""

    # Clear any previous timetable
    db.query(Timetable).delete()
    db.commit()

    saved = 0
    for (c, s, t, sl, r), var in assign.items():
        if solver.Value(var) == 1:
            entry = Timetable(
                class_id=c,
                subject_id=s,
                teacher_id=t,
                slot_id=sl,
                room_id=r
            )
            db.add(entry)
            saved += 1

    db.commit()
    return {'status': 'success', 'entries_saved': saved}

def solution_to_dict(solver, assign) -> list:
    """Convert solution to list of dicts (used in API response)"""
    result = []
    for (c, s, t, sl, r), var in assign.items():
        if solver.Value(var) == 1:
            result.append({
                'class_id':   c,
                'subject_id': s,
                'teacher_id': t,
                'slot_id':    sl,
                'room_id':    r
            })
    return result
