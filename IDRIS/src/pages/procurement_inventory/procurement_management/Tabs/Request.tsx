import React, { useState, useEffect, useContext } from "react";
import "../ProcurementManagement.scss";

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
import { RejectRequest } from "./Modals/RequestModals/RejectRequest";
import { ApproveRequest } from "./Modals/RequestModals/AcceptRequest";
import { useUserRoleContext } from "../../../../UserRoleContext";
import { RealTimeDataContext } from "../../../../RealTimeDataContext";
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

  const openModal = (
    type: Exclude<ModalType, null>,
    item: ProcurementRequest | null = null,
  ) => {
    setActiveModal(type);
    setSelectedItem(item);
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
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
        ></ViewDetails>
      )}

      {activeModal === "update" && userRoles.includes("logistics admin") && (
        <UpdateRequestStatus
          onClose={closeModal}
          selectedItem={selectedItem}
          refreshData={refreshData}
          apiUrl={apiUrl}
        ></UpdateRequestStatus>
      )}
      {activeModal === "reject" && userRoles.includes("logistics admin") && (
        <RejectRequest
          onClose={closeModal}
          selectedItem={selectedItem}
          refreshData={refreshData}
          apiUrl={apiUrl}
        ></RejectRequest>
      )}
      {activeModal === "approve" && userRoles.includes("logistics admin") && (
        <ApproveRequest
          onClose={closeModal}
          selectedItem={selectedItem}
          refreshData={refreshData}
          apiUrl={apiUrl}
        ></ApproveRequest>
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
                    View Details
                  </button>
                  {request.status === "pending approval" &&
                    userRoles.includes("logistics admin") && (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() => openModal("approve", request)}
                        >
                          Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => openModal("reject", request)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  {request.status !== "approved" &&
                    request.status !== "rejected" &&
                    userRoles.includes("logistics admin") && (
                      <button
                        className="action-btn"
                        onClick={() => openModal("update", request)}
                      >
                        Update Status
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
