from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_db
from app.models.models import Teacher
from app.schemas.teacher import TeacherCreate, TeacherRead, TeacherUpdate

router = APIRouter(prefix="/teachers", tags=["teachers"])


def _dump_payload(payload):
    """
    Support both Pydantic v1 (`dict`) and v2 (`model_dump`) for robustness.
    """
    if hasattr(payload, "model_dump"):
        return payload.model_dump(exclude_unset=True)
    return payload.dict(exclude_unset=True)


@router.get("", response_model=List[TeacherRead])
def get_teachers(db: Session = Depends(get_db)) -> List[TeacherRead]:
    teachers = db.query(Teacher).all()
    return [
        TeacherRead(
            teacher_id=t.teacher_id,
            teacher_name=t.teacher_name,
            max_periods_per_day=t.max_periods_per_day,
        )
        for t in teachers
    ]


@router.get("/{teacher_id}", response_model=TeacherRead)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)) -> TeacherRead:
    teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )
    return TeacherRead(
        teacher_id=teacher.teacher_id,
        teacher_name=teacher.teacher_name,
        max_periods_per_day=teacher.max_periods_per_day,
    )


@router.post("", response_model=TeacherRead, status_code=status.HTTP_201_CREATED)
def create_teacher(payload: TeacherCreate, db: Session = Depends(get_db)) -> TeacherRead:
    data = _dump_payload(payload)
    teacher = Teacher(**data)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return TeacherRead(
        teacher_id=teacher.teacher_id,
        teacher_name=teacher.teacher_name,
        max_periods_per_day=teacher.max_periods_per_day,
    )


@router.put("/{teacher_id}", response_model=TeacherRead)
def update_teacher(
    teacher_id: int, payload: TeacherUpdate, db: Session = Depends(get_db)
) -> TeacherRead:
    teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    data = _dump_payload(payload)
    for field, value in data.items():
        setattr(teacher, field, value)

    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return TeacherRead(
        teacher_id=teacher.teacher_id,
        teacher_name=teacher.teacher_name,
        max_periods_per_day=teacher.max_periods_per_day,
    )


@router.delete("/{teacher_id}", response_model=TeacherRead)
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)) -> TeacherRead:
    teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    deleted = TeacherRead(
        teacher_id=teacher.teacher_id,
        teacher_name=teacher.teacher_name,
        max_periods_per_day=teacher.max_periods_per_day,
    )

    db.delete(teacher)
    db.commit()
    return deleted

