import React, { useState, ReactNode, useEffect } from "react";
import "../ProcurementManagement.scss";
import { v4 as uuidv4 } from "uuid";
import { API } from "../../../../API_Handler/Axio_API_Handler";
type ModalType = "submit" | "view" | "approve" | "reject" | "update" | null;

type User = {
  user_id: number;
  username: string;
};

type RequestItem = {
  item_id: number;
  item_name: string;
  quantity: number;
  price_p_each: number;
};

type RequestData = {
  request_id: number;
  requester: User; // ✅ instead of requester_id, now has username
  title: string;
  lgu_name: string;
  priority: "low" | "medium" | "high";
  status: "pending approval" | "approved" | "rejected" | "in progress";
  description: string;
  justification: string;
  date: string; // ISO string from backend
  comment?: string;
  reason_or_code?: string;
  request_items: RequestItem[];
};
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);
};
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "medium";
  }
};
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending approval":
      return "pending";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "in progress":
      return "in-progress";
    default:
      return "pending";
  }
};

const calculateTotal = (items?: RequestItem[] | null): number =>
  items?.reduce((sum, item) => sum + item.quantity * item.price_p_each, 0) ?? 0;

const RequestTab = () => {
  // type RequestItem = {
  //   name: string;
  //   quantity: number;
  //   unitCost: number;
  // };
  //
  // type RequestData = {
  //   id: number;
  //   requestId: string;
  //   title: string;
  //   requester: string;
  //   department: string;
  //   requestDate: string;
  //   priority: "Low" | "Medium" | "High";
  //   status: "Pending Approval" | "Approved" | "Rejected" | "In Progress";
  //   estimatedCost: number;
  //   description: string;
  //   rejectionReason?: string; // optional
  //   items: RequestItem[];
  // };
  //
  // const procurementRequests: RequestData[] = [
  //   {
  //     id: 1,
  //     requestId: "PR-2024-001",
  //     title: "Emergency Medical Supplies",
  //     requester: "Maria Santos - Medical Team Lead",
  //     department: "Medical Response",
  //     requestDate: "2024-05-20",
  //     priority: "High",
  //     status: "Pending Approval",
  //     estimatedCost: 250000,
  //     description:
  //       "First aid kits, bandages, antiseptics for emergency response",
  //     items: [
  //       { name: "First Aid Kits", quantity: 50, unitCost: 2500 },
  //       { name: "Medical Bandages", quantity: 200, unitCost: 150 },
  //       { name: "Antiseptic Solution", quantity: 100, unitCost: 300 },
  //     ],
  //   },
  //   {
  //     id: 2,
  //     requestId: "PR-2024-002",
  //     title: "Communication Equipment",
  //     requester: "Juan Dela Cruz - Operations Manager",
  //     department: "Operations",
  //     requestDate: "2024-05-22",
  //     priority: "Medium",
  //     status: "Approved",
  //     estimatedCost: 180000,
  //     description: "Two-way radios and communication devices for field teams",
  //     items: [
  //       { name: "Two-way Radios", quantity: 20, unitCost: 8000 },
  //       { name: "Radio Batteries", quantity: 40, unitCost: 500 },
  //     ],
  //   },
  //   {
  //     id: 3,
  //     requestId: "PR-2024-003",
  //     title: "Transportation Vehicles",
  //     requester: "Pedro Garcia - Logistics Coordinator",
  //     department: "Logistics",
  //     requestDate: "2024-05-18",
  //     priority: "High",
  //     status: "Rejected",
  //     estimatedCost: 1500000,
  //     description: "Emergency response vehicles for disaster relief operations",
  //     rejectionReason: "Budget constraints - please submit revised proposal",
  //     items: [
  //       { name: "Emergency Response Van", quantity: 2, unitCost: 750000 },
  //     ],
  //   },
  //   {
  //     id: 4,
  //     requestId: "PR-2024-004",
  //     title: "Office Supplies",
  //     requester: "Ana Reyes - Administrative Officer",
  //     department: "Administration",
  //     requestDate: "2024-05-25",
  //     priority: "Low",
  //     status: "In Progress",
  //     estimatedCost: 25000,
  //     description: "General office supplies for administrative operations",
  //     items: [
  //       { name: "Office Paper", quantity: 50, unitCost: 200 },
  //       { name: "Printer Ink", quantity: 10, unitCost: 1500 },
  //       { name: "Folders", quantity: 100, unitCost: 50 },
  //     ],
  //   },
  // ];
  //

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending approval":
        return "pending";
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      case "in progress":
        return "in-progress";
      default:
        return "pending";
    }
  };

  const [requests, setRequests] = useState<RequestData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get<RequestData[]>(
          "/procurement_management/get_request",
        );
        setRequests(response.data); // ✅ set state with response
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchData();
  }, []);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<RequestData | null>(null);

  const openModal = (
    type: Exclude<ModalType, null>,
    item: RequestData | null = null,
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
        ></SubmitProcurementRequest>
      )}
      {activeModal === "view" && (
        <ViewDetails
          onClose={closeModal}
          selectedItem={selectedItem}
        ></ViewDetails>
      )}
      <div className="section-header">
        <h2>Procurement Requests</h2>
        <button className="primary-btn" onClick={() => openModal("submit")}>
          + Submit Request
        </button>
      </div>

      <div className="requests-grid">
        {requests.length > 0 &&
          requests.map((request) => (
            <div key={request.request_id} className="request-card">
              <div className="request-header">
                <div className="request-id">{request.request_id}</div>
                <div className="request-badges">
                  <span
                    className={`priority-badge ${getPriorityColor(request.priority)}`}
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
                <h3>{request.title}</h3>
                <p className="request-description">{request.description}</p>
                <div className="request-details">
                  <div className="detail-row">
                    <span>Requester:</span>
                    <span>{request.requester.username}</span>
                  </div>
                  <div className="detail-row">
                    <span>Department:</span>
                    <span>{request.lgu_name}</span>
                  </div>
                  <div className="detail-row">
                    <span>Date:</span>

                    <span>
                      {new Intl.DateTimeFormat("en-PH", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        timeZone: "Asia/Manila", // <-- force UTC+8
                      }).format(new Date(request.date))}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Estimated Cost:</span>
                    <span className="cost">
                      {formatCurrency(calculateTotal(request.request_items))}
                    </span>
                  </div>
                </div>
                {request.reason_or_code && (
                  <div className="rejection-reason">
                    <strong>Rejection Reason:</strong> {request.reason_or_code}
                  </div>
                )}
                <div className="request-actions">
                  <button
                    className="action-btn"
                    onClick={() => openModal("view", request)}
                  >
                    View Details
                  </button>
                  {request.status === "pending approval" && (
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
                    request.status !== "rejected" && (
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
interface ModalProps {
  children: ReactNode;
  modalType: Exclude<ModalType, null>; // ensures no nulls
  onClose: () => void; // or any function signature you need
  onSubmit?: () => void | Promise<void> | null;
}
const ModalOverlay: React.FC<ModalProps> = ({
  children,
  modalType,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            {modalType === "view" ? "Close" : "Cancel"}
          </button>
          {modalType !== "view" && (
            <button className="primary-btn" onClick={onSubmit}>
              {modalType === "approve"
                ? "Approve"
                : modalType === "reject"
                  ? "Reject"
                  : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
interface DefaultModalProps {
  onClose: () => void;
}

const SubmitProcurementRequest: React.FC<DefaultModalProps> = ({ onClose }) => {
  const [request, setRequest] = useState<{
    title: string;
    lgu_name: string;
    priority: string;

    description: string;
    justification: string;
  }>({
    title: "",
    lgu_name: "",
    priority: "low",

    description: "",
    justification: "",
  });
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setRequest((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const addRequest = async () => {
    let payload: any = request;
    payload.request_items = requestItems;
    const response = await API.post(
      "/procurement_management/add_request",
      payload,
    );
    console.log(response.data);
  };

  const addRequestItem = (requestItem: Omit<RequestItem, "item_id">) => {
    setRequestItems((prev) => [
      ...prev,
      {
        ...requestItem,
        item_id: uuidv4(), // ✅ unique, stable ID
      },
    ]);
  };
  const deleteItem = (id: number) => {
    setRequestItems((prev) => prev.filter((item) => item.item_id !== id));
  };
  return (
    <ModalOverlay onClose={onClose} modalType="submit" onSubmit={addRequest}>
      <div className="modal-content">
        <h3>Submit Procurement Request</h3>
        <div className="form-group">
          <label>Request Title</label>
          <input
            type="text"
            placeholder="Enter request title"
            value={request.title}
            onChange={handleChange}
            name="title"
          />
        </div>
        <div className="form-group">
          <label>LGU Name</label>
          <input
            type="text"
            placeholder="Enter LGU Name"
            value={request.lgu_name}
            onChange={handleChange}
            name="lgu_name"
          />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select
            value={request.priority}
            onChange={handleChange}
            name="priority"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Describe the procurement requirement"
            rows={4}
            value={request.description}
            onChange={handleChange}
            name="description"
          ></textarea>
        </div>
        <div className="form-group">
          <label>Request Items</label>
          <RequestItemManager
            onAdd={addRequestItem}
            onDelete={deleteItem}
            requestItems={requestItems}
          ></RequestItemManager>
        </div>
        <div className="form-group">
          <label>Justification</label>
          <textarea
            placeholder="Provide justification for this request"
            rows={3}
            value={request.justification}
            onChange={handleChange}
            name="justification"
          ></textarea>
        </div>
      </div>
    </ModalOverlay>
  );
};

interface RequestItemManagerProp {
  onAdd: (requestItem: Omit<RequestItem, "item_id">) => void;
  onDelete: (id: number) => void;
  requestItems: RequestItem[];
}
const RequestItemManager: React.FC<RequestItemManagerProp> = ({
  onAdd,
  onDelete,
  requestItems,
}) => {
  const defaultItem: Omit<RequestItem, "item_id"> = {
    item_name: "",
    quantity: 0,
    price_p_each: 0,
  };
  const [item, setItem] = useState<Omit<RequestItem, "item_id">>(defaultItem);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setItem((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "unitCost" ? Number(value) : value,
    }));
  };

  const isEmptyItem = (i: Omit<RequestItem, "item_id">) =>
    i.item_name.trim() === "" || i.quantity === 0 || i.price_p_each === 0;
  const handleAddItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isEmptyItem(item)) return;
    e.preventDefault(); // optional, only if you want to stop default form behavior
    onAdd(item);
    setItem(defaultItem);
  };
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        gap: "5px",
      }}
    >
      <form
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "row",
          gap: "5px",
        }}
      >
        <input
          type="text"
          placeholder="Enter item name"
          name="item_name"
          value={item.item_name}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          placeholder="Enter quantity"
          name="quantity"
          value={item.quantity}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          placeholder="Enter item price"
          name="price_p_each"
          value={item.price_p_each}
          onChange={handleChange}
          required
        />

        <button
          className="primary-btn"
          style={{ width: "fit-content", whiteSpace: "nowrap" }}
          onClick={handleAddItem}
        >
          Add Item
        </button>
      </form>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "200px",
          border: "2px solid #c5d7e5",
          borderRadius: "8px",
          padding: "5px",
          gap: "5px",
          overflow: "auto",
        }}
      >
        {requestItems.map((item) => (
          <div
            key={item.item_id} // 👈 important for React list rendering
            style={{
              display: "flex",
              width: "100%",
              border: "2px solid #c5d7e5",
              borderRadius: "5px",
              alignItems: "center",
              padding: "5px",
              gap: "5px",
              color: "black",
              fontWeight: "600",
            }}
          >
            <span style={{ width: "30%" }}>{item.item_name}</span>
            <span style={{ width: "20%" }}>Qty: {item.quantity}</span>
            <span style={{ width: "20%" }}>{item.price_p_each}</span>
            <span style={{ width: "20%" }}>
              {item.price_p_each * item.quantity}
            </span>

            <button
              className="primary-btn"
              style={{
                width: "fit-content",
                whiteSpace: "nowrap",
                marginLeft: "auto",
              }}
              onClick={() => onDelete(item.item_id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ViewDetailsProps extends DefaultModalProps {
  selectedItem: RequestData | null;
}

const ViewDetails: React.FC<ViewDetailsProps> = ({ onClose, selectedItem }) => {
  return (
    <ModalOverlay onClose={onClose} modalType="view">
      <div className="modal-content">
        <h3>Request Details - {selectedItem?.request_id}</h3>
        <div className="view-details">
          <div className="detail-section">
            <h4>Request Information</h4>
            <div className="detail-row">
              <strong>Title:</strong>
              <span>{selectedItem?.title}</span>
            </div>
            <div className="detail-row">
              <strong>Requester:</strong>
              <span>{selectedItem?.requester.username}</span>
            </div>
            <div className="detail-row">
              <strong>LGU Name:</strong>
              <span>{selectedItem?.lgu_name}</span>
            </div>
            <div className="detail-row">
              <strong>Priority:</strong>
              <span
                className={`priority-badge ${getPriorityColor(selectedItem?.priority || "")}`}
              >
                {selectedItem?.priority}
              </span>
            </div>
            <div className="detail-row">
              <strong>Status:</strong>
              <span
                className={`status-badge ${getStatusColor(selectedItem?.status || "")}`}
              >
                {selectedItem?.status}
              </span>
            </div>
            <div className="detail-row">
              <strong>Description:</strong>
              <span>{selectedItem?.description}</span>
            </div>
          </div>
          <div className="detail-section">
            <h4>Items Requested</h4>
            <div className="items-list">
              {selectedItem?.request_items?.map((item, index) => (
                <div key={index} className="item-row">
                  <span>{item.item_name}</span>
                  <span>Qty: {item.quantity}</span>
                  <span>{formatCurrency(item.price_p_each)}</span>
                  <span>
                    <strong>
                      {formatCurrency(item.quantity * item.price_p_each)}
                    </strong>
                  </span>
                </div>
              ))}
              <div className="items-total">
                <strong>
                  Total:{" "}
                  {formatCurrency(
                    calculateTotal(selectedItem?.request_items) || 0,
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default RequestTab;
