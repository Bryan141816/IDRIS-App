from fastapi import APIRouter, Depends
from routers.role_checker import RoleChecker

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin", "superuser"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["generic", "contributor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin",  "superuser", "generic", "contributor"]))],
)
