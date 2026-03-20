from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_db
from app.models.models import Class as ClassModel
from app.schemas.class_ import ClassCreate, ClassRead, ClassUpdate

router = APIRouter(prefix="/classes", tags=["classes"])


def _dump_payload(payload):
    """
    Support both Pydantic v1 (`dict`) and v2 (`model_dump`) for robustness.
    """
    if hasattr(payload, "model_dump"):
        return payload.model_dump(exclude_unset=True)
    return payload.dict(exclude_unset=True)


@router.get("", response_model=List[ClassRead])
def get_classes(db: Session = Depends(get_db)) -> List[ClassRead]:
    classes = db.query(ClassModel).all()
    return [ClassRead(class_id=c.class_id, class_name=c.class_name) for c in classes]


@router.get("/{class_id}", response_model=ClassRead)
def get_class(class_id: int, db: Session = Depends(get_db)) -> ClassRead:
    class_obj = db.query(ClassModel).filter(ClassModel.class_id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )
    return ClassRead(class_id=class_obj.class_id, class_name=class_obj.class_name)


@router.post("", response_model=ClassRead, status_code=status.HTTP_201_CREATED)
def create_class(payload: ClassCreate, db: Session = Depends(get_db)) -> ClassRead:
    data = _dump_payload(payload)
    class_obj = ClassModel(**data)
    db.add(class_obj)
    db.commit()
    db.refresh(class_obj)
    return ClassRead(class_id=class_obj.class_id, class_name=class_obj.class_name)


@router.put("/{class_id}", response_model=ClassRead)
def update_class(
    class_id: int, payload: ClassUpdate, db: Session = Depends(get_db)
) -> ClassRead:
    class_obj = db.query(ClassModel).filter(ClassModel.class_id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )

    data = _dump_payload(payload)
    for field, value in data.items():
        setattr(class_obj, field, value)

    db.add(class_obj)
    db.commit()
    db.refresh(class_obj)
    return ClassRead(class_id=class_obj.class_id, class_name=class_obj.class_name)


@router.delete("/{class_id}", response_model=ClassRead)
def delete_class(class_id: int, db: Session = Depends(get_db)) -> ClassRead:
    class_obj = db.query(ClassModel).filter(ClassModel.class_id == class_id).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )

    deleted = ClassRead(class_id=class_obj.class_id, class_name=class_obj.class_name)
    db.delete(class_obj)
    db.commit()
    return deleted

