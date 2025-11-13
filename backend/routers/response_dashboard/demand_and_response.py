from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import ProcurementRequest, DistributionRoute
from datetime import datetime
from typing import List, Dict, Any
from routers.role_checker import RoleChecker
from collections import defaultdict
router = APIRouter(
    tags=["demand_and_response"],
)

router_admin = APIRouter(
    dependencies=[
        Depends(RoleChecker(["lgu officer", "superadmin", "logistics admin"]))
    ],
)


@router.get(
    "/response_dashboard/demand_and_response/get_map_pin",
    response_model=List[Dict[str, Any]],
)
def get_markers(db: Session = Depends(get_db)):

    requests = (
        db.query(ProcurementRequest)
        .filter(ProcurementRequest.routes.has(DistributionRoute.status == "Completed"))
        .options(
            joinedload(ProcurementRequest.lgu),
            joinedload(ProcurementRequest.barangay),
            joinedload(ProcurementRequest.evacuation_center),
            joinedload(ProcurementRequest.relief_items),
            joinedload(ProcurementRequest.procurement_items),
            joinedload(ProcurementRequest.routes),
        )
        .all()
    )


    grouped = defaultdict(list)

    for req in requests:
        # Determine coordinates, address, and contact info
        if req.use_different_end:
            if req.different_end_type == "barangay" and req.barangay:
                lat = req.barangay.lat
                lng = req.barangay.lng
                address = f"{req.barangay.name}, {req.lgu.lgu_name}, Cebu"
                contact_name = req.barangay.barangay_captain or "N/A"
                contact_phone = req.barangay.contact_info or "N/A"
            elif req.different_end_type == "evacuation" and req.evacuation_center:
                lat = req.evacuation_center.lat
                lng = req.evacuation_center.lng
                address = f"{req.evacuation_center.name}, {req.lgu.lgu_name}, Cebu"
                contact_name = req.barangay.barangay_captain if req.barangay else "N/A"
                contact_phone = req.barangay.contact_info if req.barangay else "N/A"
            else:
                lat = req.lgu.lat
                lng = req.lgu.lng
                address = f"{req.lgu.lgu_name}, Cebu"
                contact_name = str(req.lgu.mayor)
                contact_phone = str(req.lgu.lgu_contact)
        else:
            lat = req.lgu.lat
            lng = req.lgu.lng
            address = f"{req.lgu.lgu_name}, Cebu"
            contact_name = str(req.lgu.mayor)
            contact_phone = str(req.lgu.lgu_contact)

        # Collect needs
        items = []
        if req.relief_items:
            for item in req.relief_items:
                items.append({
                    "id": item.item_id,
                    "need": item.item_name,
                    "amount": str(item.quantity),
                    "unit": "pcs"
                })
        elif req.procurement_items:
            for item in req.procurement_items:
                items.append({
                    "id": item.item_id,
                    "need": item.item_name,
                    "amount": str(item.quantity),
                    "unit": item.unit
                })

        # Store all needed info in the grouped dict
        grouped[(lat, lng)].append({
            "request_id": req.request_id,
            "type": req.request_type,
            "items": items,
            "address": address,
            "contact_name": contact_name,
            "contact_phone": contact_phone,
            "priority": req.priority.lower() if req.priority else "medium",
            "submitted_at": req.date_requested.isoformat() if req.date_requested else None,
            "title_label": req.request_title,
            # include route updated_at
       
            "updated_at": req.routes.updated_at.isoformat() if req.routes else None

        })

    result = []
    for (lat, lng), demands in grouped.items():
        # Determine overall type
        types = {d["type"] for d in demands}
        overall_type = "both" if len(types) > 1 else types.pop()

        # Flatten needs and attach updated_at
        needs = [
            {
                "type": d["type"],
                "items": d["items"],
                "updated_at": d.get("updated_at")
            }
            for d in demands
        ]

        # Use first request's address/contact/priority/title
        first_req = demands[0]

        data = {
            "demand_id": ", ".join(str(d["request_id"]) for d in demands),
            "type": overall_type,
            "title_label": first_req["title_label"],
            "lat": lat,
            "lng": lng,
            "address": first_req["address"],
            "last_updated": datetime.now().isoformat(),
            "contact": {
                "name": first_req["contact_name"],
                "phone": first_req["contact_phone"],
            },
            "status": "completed",
            "priority": first_req["priority"],
            "submitted_at": first_req["submitted_at"],
            "needs": needs,
        }
        result.append(data)

    return result


