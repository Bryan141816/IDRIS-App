from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Literal, Optional

# --- Cell ---
class Cell(BaseModel):
    type: Literal["Text", "Button", "Image", "Hidden"]
    text: str
    font_weight: int
    width: Optional[str] = None  
    color: Optional[str] = None
    container_width: Optional[str] = None
    button_width: Optional[str] = None
    background_color: Optional[str] = None

# --- Table head and data ---
class TableHead(BaseModel):
    text: str
    width: str

class TableDataRow(BaseModel):
    data: List[Cell]

class TableResponse(BaseModel):
    table_head: List[TableHead]
    table_datas: List[TableDataRow]

