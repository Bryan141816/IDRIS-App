import { ProcurementRequest } from "../ProcurementDefaults";
import { formatDateShort } from "../../../../CommonFunctions";
import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { ModalOverlay } from "../ProcurementModalsDefault";
import { ModalType } from "../ProcurementDefaults";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
interface ViewDetailsProps extends ProcurementDefaultModalProps {
  selectedItem: ProcurementRequest | null;
  mode?: Exclude<ModalType, null>;
}
type requestItemsType = {
  item_id: number;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
};
type AssignedStorageItem = {
  assigned_id: number;
  quantity: number;
  inventory_item_name: string;
  inventory_category: string;
  warehouse_zone_name: string;
};

export const ViewDetails: React.FC<ViewDetailsProps> = ({
  onClose,
  refreshData,
  selectedItem,
  mode = "view",
}) => {
  const [requestList, setRequestList] = useState<
    (requestItemsType & StorageInfo)[]
  >([]);

  useEffect(() => {
    if (selectedItem?.request_type === "relief") {
      const mapped = selectedItem.items.map((item) => {
        const category = "category" in item ? item.category : "";
        const unit = "unit" in item ? item.unit || "" : "";

        let assigned_id = -1;
        let inventory_name = "";
        let warehouse_name = "";
        let quantity_assigned = -1;

        if (selectedItem.route) {
          const distributed = selectedItem.route.distributed_items.find(
            (d: any) => d.item_id === item.item_id,
          );
          if (distributed) {
            assigned_id = distributed.assigned_storage;
            inventory_name =
              distributed.assigned_storage_rec.inventory_item.item_name;
            warehouse_name =
              distributed.assigned_storage_rec.warehouse.zone_name;
            quantity_assigned = distributed.quantity;
          }
        }

        return {
          item_id: item.item_id,
          name: item.name,
          category, // safe
          quantity: item.quantity,
          unit, // safe
          assigned_id,
          inventory_name,
          warehouse_name,
          quantity_assigned,
        };
      });

      setRequestList(mapped);
    }
  }, []);

  const handleApproval = async (type: string) => {
    let reason = "";

    // If REJECT, ask for reason before confirmation
    if (type.toLowerCase() === "reject") {
      const { value: inputReason } = await Swal.fire({
        title: "Reason for Rejection",
        input: "textarea",
        inputPlaceholder: "Enter reason...",
        inputLabel: "Why are you rejecting this request?",
        showCancelButton: true,
        confirmButtonText: "Continue",
      });

      if (!inputReason) {
        Swal.fire({
          icon: "warning",
          title: "A reason is required to reject.",
        });
        return;
      }

      reason = inputReason;
    }

    // General confirmation
    const confirm = await Swal.fire({
      title: `Are you sure you want to ${type} this request?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
    });

    if (!confirm.isConfirmed) return;

    try {
      const params =
        type.toLowerCase() === "reject"
          ? `procurement_management/approve_reject_request?request_id=${selectedItem?.request_id ?? -1}&type=${type}&reason=${encodeURIComponent(reason)}`
          : `procurement_management/approve_reject_request?request_id=${selectedItem?.request_id ?? -1}&type=${type}`;

      const response = await API.post(params);

      Swal.fire({
        title: `Request has been ${
          type.toLowerCase() === "approve" ? "Approved" : "Rejected"
        }`,
        icon: "success",
      });

      refreshData();
      onClose();
    } catch (e: any) {
      console.error(
        `Error ${type} in request ${selectedItem?.request_ref_num}`,
      );
    }
  };

  const onReject = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }
    handleApproval("reject");
  };
  const onApprove = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }
    handleApproval("approve");
  };
  return (
    <ModalOverlay
      onClose={onClose}
      modalType={mode}
      onSubmit={onApprove}
      onReject={onReject}
      minWidth={"75vw"}
    >
      <div className="modal-content">
        <h3>Request Details - {selectedItem?.request_ref_num}</h3>
        <div className="view-details">
          <div className="detail-section">
            <h4>Request Information</h4>
            <div className="detail-row">
              <strong>Title:</strong>
              <span>{selectedItem?.request_title ?? ""}</span>
            </div>
            <div className="detail-row">
              <strong>Reference Number:</strong>
              <span>{selectedItem?.request_ref_num ?? ""}</span>
            </div>
            <div className="detail-row">
              <strong>Request Type:</strong>
              <span>{selectedItem?.request_type.toUpperCase() ?? ""}</span>
            </div>
            <div
              className="detail-row"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                alignItems: "start",
              }}
            >
              <strong>Description:</strong>
              <span
                style={{
                  width: "100%",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  display: "block",
                  textAlign: "start",
                }}
              >
                {selectedItem?.request_description ?? ""}
              </span>
            </div>

            <div className="detail-row">
              <strong>Delivery Location:</strong>

              <span>
                {selectedItem?.use_different_end
                  ? `${selectedItem?.end_target?.name ?? "Unknown"}, ${selectedItem?.lgu?.name ?? "N/A"}`
                  : `${selectedItem?.lgu?.name ?? "N/A"}`}
                , Cebu
              </span>
            </div>
            <div className="detail-row">
              <strong>Request Status:</strong>
              <span>{selectedItem?.status.toUpperCase() ?? ""}</span>
            </div>
            <div className="detail-row">
              <strong>Priority:</strong>
              <span>{selectedItem?.priority?.toUpperCase() ?? ""}</span>
            </div>
            <div className="detail-row">
              <strong>Date Requested:</strong>
              <span>{formatDateShort(selectedItem?.date_requested ?? "")}</span>
            </div>
            <div className="detail-row">
              <strong>Date Needed:</strong>
              <span>{formatDateShort(selectedItem?.date_needed ?? "")}</span>
            </div>
            {selectedItem?.status === "Rejected" &&
              selectedItem?.reject_reason && (
                <div className="detail-row">
                  <strong>Rejection Reason:</strong>
                  <span>{selectedItem?.reject_reason}</span>
                </div>
              )}

            <div
              className="detail-row"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                alignItems: "start",
              }}
            >
              <strong>Request:</strong>
              <div style={{ background: "white", width: "100%" }}>
                {selectedItem?.items_source === "relief" ? (
                  <RequestItemsHandler
                    requestItems={requestList}
                    setRequestListState={setRequestList}
                    status={selectedItem.status}
                    type={mode}
                    showInventory={
                      selectedItem.route
                        ? selectedItem.route.distributed_items.length > 0
                        : false
                    }
                  ></RequestItemsHandler>
                ) : (
                  <table style={{ width: "100%" }}>
                    <thead
                      style={{
                        background:
                          "linear-gradient(135deg, #749ab6 0%, #5a8aa8 100%)",
                        color: "white",
                      }}
                    >
                      <tr>
                        <th style={{ textAlign: "start", padding: "10px" }}>
                          Name
                        </th>
                        <th style={{ textAlign: "start", padding: "10px" }}>
                          Quantity
                        </th>
                        <th style={{ textAlign: "start", padding: "10px" }}>
                          Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem?.items &&
                        selectedItem.items.length > 0 &&
                        selectedItem.items.map((item, index) => (
                          <tr key={index}>
                            <td style={{ padding: "10px" }}>{item.name}</td>
                            <td style={{ padding: "10px" }}>{item.quantity}</td>
                            <td style={{ padding: "10px" }}>
                              {"unit" in item ? item.unit : "-"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};

type StorageInfo = {
  assigned_id: number;
  inventory_name: string;
  warehouse_name: string;
  quantity_assigned: number;
};
interface RequestItemsHandlerProp {
  requestItems: (requestItemsType & StorageInfo)[];
  setRequestListState: React.Dispatch<
    React.SetStateAction<(requestItemsType & StorageInfo)[]>
  >;
  status: string;
  type: string;
  showInventory?: boolean;
}

export const RequestItemsHandler: React.FC<RequestItemsHandlerProp> = ({
  requestItems,
  status,
  setRequestListState,
  type,
  showInventory = true,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<
    (requestItemsType & StorageInfo) | null
  >(null);
  const [openPickInventory, setOpenPickInventory] = useState(false);
  const [requestIndexPicked, setRequestIndexPicked] = useState(-1);

  const openInventory = (
    item: requestItemsType & StorageInfo,
    index: number,
  ) => {
    setOpenPickInventory(true);
    setSelectedRequest(item);
    setRequestIndexPicked(index);
  };
  const closeInventory = () => {
    setOpenPickInventory(false);
    setSelectedRequest(null);
    setRequestIndexPicked(-1);
  };

  const handlePickInventorySubmit = (index: number, inventory: StorageInfo) => {
    setRequestListState((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              assigned_id: inventory.assigned_id,
              inventory_name: inventory.inventory_name,
              warehouse_name: inventory.warehouse_name,
              quantity_assigned: inventory.quantity_assigned,
            }
          : item,
      ),
    );
  };
  console.log(type);
  const clearInventory = (index: number) => {
    setRequestListState((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              assigned_id: -1,
              inventory_name: "",
              warehouse_name: "",
              quantity_assigned: -1,
            }
          : item,
      ),
    );
  };

  return (
    <>
      {openPickInventory && selectedRequest && (
        <PickInventoryModal
          onClose={closeInventory}
          item={selectedRequest}
          index={requestIndexPicked}
          onSubmit={handlePickInventorySubmit}
          type={
            status.toLowerCase() === "waiting for additional action"
              ? "add"
              : "check"
          }
        ></PickInventoryModal>
      )}
      <div
        style={{
          display: "flex",
          background: "white",
          width: "100%",
          overflow: "auto",
        }}
      >
        <table style={{ width: "100%" }}>
          <thead
            style={{
              background: "linear-gradient(135deg, #749ab6 0%, #5a8aa8 100%)",
              color: "white",
            }}
          >
            <tr>
              <th style={{ textAlign: "start", padding: "10px" }}>Items</th>
              <th style={{ textAlign: "start", padding: "10px" }}>Category</th>
              <th style={{ textAlign: "start", padding: "10px" }}>
                Quantity Needed
              </th>
              <th style={{ textAlign: "start", padding: "10px" }}>Unit</th>
              {status.toLowerCase() !== "pending approval" && showInventory && (
                <>
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Inventory Name
                  </th>
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Quantity
                  </th>
                  {type !== "view" && (
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Warehouse
                    </th>
                  )}
                </>
              )}
              {(type === "review" || type === "picking") && (
                <th style={{ textAlign: "start", padding: "10px" }}>Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {requestItems.length > 0 &&
              requestItems.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: "10px" }}>{item.name}</td>
                  <td style={{ padding: "10px" }}>{item.category}</td>
                  <td style={{ padding: "10px" }}>{item.quantity}</td>
                  <td style={{ padding: "10px" }}>{item.unit}</td>
                  {status.toLowerCase() !== "pending approval" &&
                    showInventory && (
                      <>
                        <td style={{ padding: "10px" }}>
                          {item.inventory_name}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {item.quantity_assigned !== -1
                            ? item.quantity_assigned
                            : ""}
                        </td>
                        {type !== "view" && (
                          <td style={{ padding: "10px" }}>
                            {item.warehouse_name}
                          </td>
                        )}
                      </>
                    )}
                  {type !== "view" && (
                    <td style={{ padding: "10px", width: "fit-content" }}>
                      {status.toLowerCase() === "pending approval" && (
                        <>
                          <button
                            className="action-btn"
                            style={{ width: "fit-content" }}
                            onClick={(
                              e: React.MouseEvent<HTMLButtonElement>,
                            ) => {
                              e.preventDefault();
                              openInventory(item, index);
                            }}
                          >
                            Check Availability
                          </button>
                        </>
                      )}
                      {status.toLowerCase() ===
                        "waiting for additional action" && (
                        <>
                          <button
                            className="action-btn"
                            style={{ width: "fit-content" }}
                            onClick={(
                              e: React.MouseEvent<HTMLButtonElement>,
                            ) => {
                              e.preventDefault();
                              openInventory(item, index);
                            }}
                          >
                            Pick From Inventory
                          </button>
                          <button
                            className="action-btn"
                            style={{ width: "fit-content" }}
                            onClick={(
                              e: React.MouseEvent<HTMLButtonElement>,
                            ) => {
                              e.preventDefault();
                              clearInventory(index);
                            }}
                          >
                            Clear Selected
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

interface PickInventoryModalProp {
  onClose: () => void;
  item: requestItemsType & StorageInfo;
  index: number;
  onSubmit: (index: number, inventory: StorageInfo) => void;
  type?: string;
}

const PickInventoryModal: React.FC<PickInventoryModalProp> = ({
  onClose,
  item,
  index,
  onSubmit,
  type = "check",
}) => {
  const [responseData, setResponseData] = useState<AssignedStorageItem[]>([]);
  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await API.get(
          `/distribution_planning/get_assigned?category=${encodeURIComponent(item.category ?? "food items")}`,
        );
        setResponseData(response.data);
      } catch (e: any) {
        console.error("Error fetching inventory: " + e.message);
      }
    };
    fetch();
  }, []);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [quantityInput, setQuantityInput] = useState(-1);

  const handlCheckChange = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedIndex(index);
    } else {
      setSelectedIndex(-1);
      setQuantityInput(-1);
    }
  };
  const handleSubmit = () => {
    const selected = responseData[selectedIndex];
    onSubmit(index, {
      assigned_id: selected.assigned_id,
      inventory_name: selected.inventory_item_name,
      warehouse_name: selected.warehouse_zone_name,
      quantity_assigned: quantityInput,
    });
    onClose();
  };
  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal " style={{ minWidth: "50vw" }}>
        <div className="modal-header">
          <h3>Pick Inventory Item</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">
          <div style={{ background: "white", width: "100%" }}>
            <table style={{ width: "100%" }}>
              <thead
                style={{
                  background:
                    "linear-gradient(135deg, #749ab6 0%, #5a8aa8 100%)",
                  color: "white",
                }}
              >
                <tr>
                  {type !== "check" && (
                    <th style={{ textAlign: "start", padding: "10px" }}></th>
                  )}
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Items Name
                  </th>
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Category
                  </th>
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Available Quantity
                  </th>
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Warehouse
                  </th>
                  {type !== "check" && (
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Quantity
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {responseData.length > 0 &&
                  responseData.map((item, index) => (
                    <tr key={index}>
                      {type !== "check" && (
                        <td style={{ padding: "10px" }}>
                          <input
                            type="checkbox"
                            checked={index === selectedIndex}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => handlCheckChange(index, e.target.checked)}
                          />
                        </td>
                      )}
                      <td style={{ padding: "10px" }}>
                        {item.inventory_item_name}
                      </td>
                      <td style={{ padding: "10px" }}>
                        {item.inventory_category}
                      </td>
                      <td style={{ padding: "10px" }}>{item.quantity}</td>
                      <td style={{ padding: "10px" }}>
                        {item.warehouse_zone_name}
                      </td>
                      {type !== "check" && (
                        <td style={{ padding: "10px" }}>
                          <input
                            type="number"
                            value={
                              quantityInput !== -1 && selectedIndex === index
                                ? quantityInput
                                : ""
                            }
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => {
                              const value =
                                e.target.value === ""
                                  ? -1
                                  : Number(e.target.value);
                              if (value >= item.quantity) {
                                setQuantityInput(item.quantity);
                                return;
                              }
                              setQuantityInput(value);
                            }}
                            disabled={selectedIndex !== index}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-actions">
          <button
            className="secondary-btn"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              onClose();
            }}
          >
            Cancel
          </button>
          {type !== "check" && (
            <button
              className="primary-btn"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              Select Item
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
