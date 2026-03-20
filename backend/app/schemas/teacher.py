from typing import Optional

from pydantic import BaseModel


class TeacherBase(BaseModel):
    teacher_name: str
    max_periods_per_day: int = 6


class TeacherCreate(BaseModel):
    teacher_name: str
    max_periods_per_day: Optional[int] = None


class TeacherUpdate(BaseModel):
    teacher_name: Optional[str] = None
    max_periods_per_day: Optional[int] = None


class TeacherRead(BaseModel):
    teacher_id: int
    teacher_name: str
    max_periods_per_day: int

