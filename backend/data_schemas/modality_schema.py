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
