from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_db
from app.models.models import Room
from app.schemas.room import RoomCreate, RoomRead, RoomUpdate

router = APIRouter(prefix="/rooms", tags=["rooms"])


def _dump_payload(payload):
    """
    Support both Pydantic v1 (`dict`) and v2 (`model_dump`) for robustness.
    """
    if hasattr(payload, "model_dump"):
        return payload.model_dump(exclude_unset=True)
    return payload.dict(exclude_unset=True)


@router.get("", response_model=List[RoomRead])
def get_rooms(db: Session = Depends(get_db)) -> List[RoomRead]:
    rooms = db.query(Room).all()
    return [
        RoomRead(
            room_id=r.room_id,
            room_number=r.room_number,
            room_type=r.room_type,
        )
        for r in rooms
    ]


@router.get("/{room_id}", response_model=RoomRead)
def get_room(room_id: int, db: Session = Depends(get_db)) -> RoomRead:
    room = db.query(Room).filter(Room.room_id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )
    return RoomRead(
        room_id=room.room_id,
        room_number=room.room_number,
        room_type=room.room_type,
    )


@router.post("", response_model=RoomRead, status_code=status.HTTP_201_CREATED)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)) -> RoomRead:
    data = _dump_payload(payload)
    room = Room(**data)
    db.add(room)
    db.commit()
    db.refresh(room)
    return RoomRead(
        room_id=room.room_id,
        room_number=room.room_number,
        room_type=room.room_type,
    )


@router.put("/{room_id}", response_model=RoomRead)
def update_room(
    room_id: int, payload: RoomUpdate, db: Session = Depends(get_db)
) -> RoomRead:
    room = db.query(Room).filter(Room.room_id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    data = _dump_payload(payload)
    for field, value in data.items():
        setattr(room, field, value)

    db.add(room)
    db.commit()
    db.refresh(room)
    return RoomRead(
        room_id=room.room_id,
        room_number=room.room_number,
        room_type=room.room_type,
    )


@router.delete("/{room_id}", response_model=RoomRead)
def delete_room(room_id: int, db: Session = Depends(get_db)) -> RoomRead:
    room = db.query(Room).filter(Room.room_id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    deleted = RoomRead(
        room_id=room.room_id,
        room_number=room.room_number,
        room_type=room.room_type,
    )

    db.delete(room)
    db.commit()
    return deleted

