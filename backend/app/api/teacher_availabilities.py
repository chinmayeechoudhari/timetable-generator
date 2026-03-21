from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_db
from app.models.models import TeacherAvailability
from app.schemas.teacher_availability import (
    TeacherAvailabilityCreate,
    TeacherAvailabilityRead,
    TeacherAvailabilityUpdate,
)

router = APIRouter(prefix="/teacher-availabilities", tags=["teacher-availabilities"])


def _dump_payload(payload):
    """
    Support both Pydantic v1 (`dict`) and v2 (`model_dump`) for robustness.
    """
    if hasattr(payload, "model_dump"):
        return payload.model_dump(exclude_unset=True)
    return payload.dict(exclude_unset=True)


@router.get("", response_model=List[TeacherAvailabilityRead])
def get_teacher_availabilities(
    db: Session = Depends(get_db),
) -> List[TeacherAvailabilityRead]:
    items = db.query(TeacherAvailability).all()
    return [
        TeacherAvailabilityRead(
            teacher_id=i.teacher_id,
            slot_id=i.slot_id,
            is_available=i.is_available,
        )
        for i in items
    ]


@router.get("/{teacher_id}/{slot_id}", response_model=TeacherAvailabilityRead)
def get_teacher_availability(
    teacher_id: int,
    slot_id: int,
    db: Session = Depends(get_db),
) -> TeacherAvailabilityRead:
    item = (
        db.query(TeacherAvailability)
        .filter(
            TeacherAvailability.teacher_id == teacher_id,
            TeacherAvailability.slot_id == slot_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TeacherAvailability not found",
        )
    return TeacherAvailabilityRead(
        teacher_id=item.teacher_id,
        slot_id=item.slot_id,
        is_available=item.is_available,
    )


@router.post(
    "", response_model=TeacherAvailabilityRead, status_code=status.HTTP_201_CREATED
)
def create_teacher_availability(
    payload: TeacherAvailabilityCreate,
    db: Session = Depends(get_db),
) -> TeacherAvailabilityRead:
    data = _dump_payload(payload)
    item = TeacherAvailability(**data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return TeacherAvailabilityRead(
        teacher_id=item.teacher_id,
        slot_id=item.slot_id,
        is_available=item.is_available,
    )


@router.put("/{teacher_id}/{slot_id}", response_model=TeacherAvailabilityRead)
def update_teacher_availability(
    teacher_id: int,
    slot_id: int,
    payload: TeacherAvailabilityUpdate,
    db: Session = Depends(get_db),
) -> TeacherAvailabilityRead:
    item = (
        db.query(TeacherAvailability)
        .filter(
            TeacherAvailability.teacher_id == teacher_id,
            TeacherAvailability.slot_id == slot_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TeacherAvailability not found",
        )

    data = _dump_payload(payload)
    for field, value in data.items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return TeacherAvailabilityRead(
        teacher_id=item.teacher_id,
        slot_id=item.slot_id,
        is_available=item.is_available,
    )


@router.delete("/{teacher_id}/{slot_id}", response_model=TeacherAvailabilityRead)
def delete_teacher_availability(
    teacher_id: int,
    slot_id: int,
    db: Session = Depends(get_db),
) -> TeacherAvailabilityRead:
    item = (
        db.query(TeacherAvailability)
        .filter(
            TeacherAvailability.teacher_id == teacher_id,
            TeacherAvailability.slot_id == slot_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TeacherAvailability not found",
        )

    deleted = TeacherAvailabilityRead(
        teacher_id=item.teacher_id,
        slot_id=item.slot_id,
        is_available=item.is_available,
    )

    db.delete(item)
    db.commit()
    return deleted

