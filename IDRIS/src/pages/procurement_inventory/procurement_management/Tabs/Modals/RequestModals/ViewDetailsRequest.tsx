import { RequestData } from "../ProcurementDefaults";
import {
  getPriorityColor,
  getStatusColor,
  formatCurrency,
  calculateTotal,
} from "../ProcurementDefaults";
import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { ModalOverlay } from "../ProcurementModalsDefault";

interface ViewDetailsProps extends ProcurementDefaultModalProps {
  selectedItem: RequestData | null;
}

export const ViewDetails: React.FC<ViewDetailsProps> = ({
  onClose,
  selectedItem,
}) => {
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
