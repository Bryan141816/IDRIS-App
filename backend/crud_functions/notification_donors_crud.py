from sqlalchemy.orm import Session
from typing import List
from models import Donor

class NotificationDonorsCRUD:
    @staticmethod
    def get_all_donors_for_notification(db: Session) -> List[Donor]:
        """Get all donors for notification."""
        return db.query(Donor).all()

notification_donors_crud = NotificationDonorsCRUD()
