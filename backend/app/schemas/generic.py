from pydantic import BaseModel


class GenericItem(BaseModel):
    id: int
    name: str
