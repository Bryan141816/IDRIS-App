import React, { useState, useEffect, useContext } from "react";
import "../../ProcurementInventory.scss";
import "../../ProcurementModal.scss";
import { API } from "../../../../API_Handler/Axio_API_Handler";
import {
  ProcurementRequest,
  ModalType,
  getPriorityColor,
  getStatusColor,
  formatCurrency,
} from "./Modals/ProcurementDefaults";
import { SubmitProcurementRequest } from "./Modals/RequestModals/AddRequestModal";
import { ViewDetails } from "./Modals/RequestModals/ViewDetailsRequest";
import { UpdateRequestStatus } from "./Modals/RequestModals/UpdateStatus";

import { useUserRoleContext } from "../../../../UserRoleContext";
import { RealTimeDataContext } from "../../../../RealTimeDataContext";
import { DistributionRouteDTO } from "../../distribution_planning/Tabs/RoutesAndPlanning";
import { ViewRoute } from "../../distribution_planning/Tabs/Modals/ViewRoute/ViewRoute";
import { TrackDelivery } from "./Modals/RequestModals/TrackModal";
interface RequestTabProps {
  apiUrl: string;
}
const RequestTab: React.FC<RequestTabProps> = ({ apiUrl }) => {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const { userRoles } = useUserRoleContext();
  const { event, connected } = useContext(RealTimeDataContext);
  const fetchData = async () => {
    try {
      const response = await API.get<ProcurementRequest[]>(
        `${apiUrl}/get_request`,
      );
      setRequests(response.data); // ✅ set state with response
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const refreshData = () => fetchData();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<ProcurementRequest | null>(
    null,
  );
  const [selectedRoute, setSelectedRoute] =
    useState<DistributionRouteDTO | null>(null);

  const normalizeRequestForRoute = (requests: ProcurementRequest) => {
    type reliefType = {
      item_id: number;
      request_id: number;
      item_name: string;
      category: string;
      quantity: number;
    };
    type procurementType = {
      item_id: number;
      request_id: number;
      item_name: string;
      quantity: number;
      unit: string;
    };

    let barangay = null;
    let evacuation_center = null;

    let relief: reliefType[] = [];
    let procurement_items: procurementType[] = [];
    if (requests.use_different_end && requests.end_target) {
      if (requests.different_end_type === "barangay") {
        barangay = {
          id: requests.end_target.id ?? 0, // ensure number
          name: requests.end_target.name ?? "",
          lat: requests.end_target.lat ?? 0,
          lng: requests.end_target.lng ?? 0,
        };
      } else {
        evacuation_center = {
          evacuation_id: requests.end_target.id ?? 0, // match type
          name: requests.end_target.name ?? "",
          lat: requests.end_target.lat ?? 0,
          lng: requests.end_target.lng ?? 0,
        };
      }
    }
    if (requests.request_type === "relief") {
      requests.items.map((item) => {
        const { item_id, name, category, quantity } = item;
        const relief_item: reliefType = {
          item_id: item_id,
          request_id: requests.request_id,
          item_name: name,
          category: category,
          quantity: quantity,
        };
        relief.push(relief_item);
      });
    } else {
      requests.items.map((item) => {
        const { item_id, name, quantity, unit } = item;
        const procurement_item: procurementType = {
          item_id: item_id,
          request_id: requests.request_id,
          item_name: name,
          unit: unit,
          quantity: quantity,
        };
        procurement_items.push(procurement_item);
      });
    }
    const cleanRequest = {
      request_id: requests.request_id,
      lgu_id: requests.lgu.id,
      request_type: requests.request_type,
      request_ref_num: requests.request_ref_num,
      request_title: requests.request_title,
      request_description: requests.request_description,
      use_different_end: requests.use_different_end,
      different_end_type: requests.different_end_type,
      status: requests.status,
      end_barangay: barangay?.id ?? null,
      end_evac: evacuation_center?.evacuation_id ?? null,
      end_address: null,
      end_lat: null,
      end_long: null,
      priority: requests.priority,
      date_requested: requests.date_requested,
      disaster_type: requests.disaster_type,
      date_needed: requests.date_needed,
      lgu: requests.lgu,
      barangay: barangay,
      evacuation_center: evacuation_center,
      relief_items: relief ?? [],
      procurement_items: procurement_items ?? [],
    };
    return cleanRequest;
  };
  const openModal = (
    type: Exclude<ModalType, null>,
    item: ProcurementRequest | null = null,
  ) => {
    setActiveModal(type);
    setSelectedItem(item);
    if (type === "track" && item?.route) {
      const request = normalizeRequestForRoute(item);
      setSelectedRoute({ ...item.route, request: request });
    }
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
    if (selectedRoute) {
      setSelectedRoute(null);
    }
  };

  return (
    <div className="requests-content">
      {activeModal === "submit" && (
        <SubmitProcurementRequest
          onClose={closeModal}
          refreshData={refreshData}
          apiUrl={apiUrl}
        ></SubmitProcurementRequest>
      )}
      {activeModal === "view" && (
        <ViewDetails
          onClose={closeModal}
          selectedItem={selectedItem}
          refreshData={refreshData}
          mode={
            userRoles.includes("lgu officer") ||
            selectedItem?.status === "Approved" ||
            selectedItem?.status === "Rejected" ||
            selectedItem?.status === "Waiting for Budget Approval"
              ? "view"
              : "review"
          }
        ></ViewDetails>
      )}
      {activeModal === "track" && selectedItem && (
        <TrackDelivery
          onClose={closeModal}
          selectedData={selectedItem}
        ></TrackDelivery>
      )}

      {activeModal === "update" && userRoles.includes("logistics admin") && (
        <UpdateRequestStatus
          onClose={closeModal}
          selectedItem={selectedItem}
          refreshData={refreshData}
          apiUrl={apiUrl}
        ></UpdateRequestStatus>
      )}

      <div className="section-header">
        <h2>Procurement Requests</h2>
        {userRoles.includes("lgu officer") && (
          <button className="primary-btn" onClick={() => openModal("submit")}>
            + Submit Request
          </button>
        )}
      </div>

      <div className="requests-grid">
        {requests.length > 0 &&
          requests.map((request) => (
            <div key={request.request_id} className="request-card">
              <div className="request-header">
                <div className="request-id">{request.request_ref_num}</div>
                <div className="request-badges">
                  <span
                    className={`priority-badge ${getPriorityColor(request.priority ?? "Low")}`}
                  >
                    {request.priority}
                  </span>
                  <span
                    className={`status-badge ${getStatusColor(request.status)}`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
              <div className="request-content">
                <h3>{request.request_title} </h3>
                <p className="request-description">
                  {request.request_description}
                </p>
                <div className="request-details">
                  <div className="detail-row">
                    <span>Requester:</span>
                    <span>{request.lgu.name}</span>
                  </div>
                  <div className="detail-row">
                    <span>Date:</span>

                    <span>
                      {new Intl.DateTimeFormat("en-PH", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        timeZone: "Asia/Manila", // <-- force UTC+8
                      }).format(new Date(request.date_requested))}
                    </span>
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    className="action-btn"
                    onClick={() => openModal("view", request)}
                  >
                    {userRoles.includes("lgu officer") ||
                    request.status === "Approved" ||
                    request.status === "Rejected" ||
                    request.status === "Waiting for Budget Approval"
                      ? "View Details"
                      : "Review Request"}
                  </button>
                  {userRoles.includes("lgu officer") && request.route && (
                    <button
                      className="action-btn"
                      onClick={() => openModal("track", request)}
                    >
                      Track Delivery
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RequestTab;
