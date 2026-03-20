from typing import Optional

from pydantic import BaseModel


class ClassBase(BaseModel):
    class_name: str


class ClassCreate(BaseModel):
    class_name: str


class ClassUpdate(BaseModel):
    class_name: Optional[str] = None


class ClassRead(BaseModel):
    class_id: int
    class_name: str

