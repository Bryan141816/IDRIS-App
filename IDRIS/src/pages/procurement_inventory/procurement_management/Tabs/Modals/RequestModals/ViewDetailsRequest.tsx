import { ProcurementRequest } from "../ProcurementDefaults";
import {
  getPriorityColor,
  getStatusColor,
  formatCurrency,
} from "../ProcurementDefaults";
import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { ModalOverlay } from "../ProcurementModalsDefault";
import { ModalType } from "../ProcurementDefaults";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";

interface ViewDetailsProps extends ProcurementDefaultModalProps {
  selectedItem: ProcurementRequest | null;
  mode?: Exclude<ModalType, null>;
}

export const ViewDetails: React.FC<ViewDetailsProps> = ({
  onClose,
  selectedItem,
  mode = "view",
}) => {
  const handleApproval = async (type: string) => {
    try {
      const response = await API.post(
        `procurement_management/approve_reject_request?request_id=${selectedItem?.request_id ?? -1}&type=${type}`,
      );
    } catch (e: any) {
      console.error(
        `Error ${type} in request ${selectedItem?.request_ref_num}`,
      );
    }
  };
  const onReject = () => {
    handleApproval("reject");
  };
  const onApprove = () => {
    handleApproval("approve");
  };
  return (
    <ModalOverlay
      onClose={onClose}
      modalType={mode}
      onSubmit={onApprove}
      onReject={onReject}
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
              <span>{selectedItem?.date_requested ?? ""}</span>
            </div>
            <div className="detail-row">
              <strong>Date Needed:</strong>
              <span>{selectedItem?.date_needed ?? ""}</span>
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
              <strong>Request:</strong>
              <div style={{ background: "white", width: "100%" }}>
                {selectedItem?.items_source === "relief" ? (
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
                          Category
                        </th>
                        <th style={{ textAlign: "start", padding: "10px" }}>
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem?.items &&
                        selectedItem.items.length > 0 &&
                        selectedItem.items.map((item, index) => (
                          <tr key={index}>
                            <td style={{ padding: "10px" }}>{item.name}</td>
                            <td style={{ padding: "10px" }}>
                              {item.category ?? "—"}
                            </td>
                            <td style={{ padding: "10px" }}>{item.quantity}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
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
                              {item.unit ?? "-"}
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
