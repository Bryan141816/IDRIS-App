from fastapi import Depends
from models import User
from routers.auth.authentication import get_current_user_from_access_token


def GetUserId():
    def checker(
        current_user: User = Depends(get_current_user_from_access_token),
    ):
        return current_user.user_id  # Only return the user ID

    return checker
