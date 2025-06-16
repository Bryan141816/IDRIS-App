from pydantic import BaseModel
from typing import List

class PieChartDataset(BaseModel):
    label: str
    data: List[int]
    backgroundColor: List[str]
    borderWidth: int

class PieChartData(BaseModel):
    labels: List[str]
    datasets: List[PieChartDataset]

class LineChartDataset(BaseModel):
    label: str
    data: List[int]
    fill: bool
    borderColor: str
    backgroundColor: str
    tension: float
    
class LineChartData(BaseModel):
    labels: List[str]
    datasets: List[LineChartDataset]

class BarChartDataset(BaseModel):
    label: str
    data: List[int]
    backgroundColor: List[str]
    borderRadius: int

class BarChartData(BaseModel):
    labels: List[str]
    datasets: List[BarChartDataset]
