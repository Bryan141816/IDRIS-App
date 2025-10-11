from typing import List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import User
from routers.auth.authentication import get_current_user_from_access_token


def RoleChecker(required_roles: List[str]):

    def checker(
        current_user: User = Depends(get_current_user_from_access_token),
    ):
        print(current_user.roles)
        print(required_roles)
        if "super admin" in current_user.roles:
            return current_user

        if not any(role in current_user.roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have the required role",
            )

        return current_user

    return checker


def GetUserRoles(
    current_user: User = Depends(get_current_user_from_access_token),
) -> List[str]:
    return current_user.roles
