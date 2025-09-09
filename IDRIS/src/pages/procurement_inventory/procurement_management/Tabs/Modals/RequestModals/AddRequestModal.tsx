import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { useState } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { ModalOverlay } from "../ProcurementModalsDefault";
import { RequestItem } from "../ProcurementDefaults";
import { RequestItemManager } from "./RequestItemManager";
import { v4 as uuidv4 } from "uuid";
export const SubmitProcurementRequest: React.FC<
  ProcurementDefaultModalProps
> = ({ onClose, refreshData, apiUrl }) => {
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
    try {
      const response = await API.post(`${apiUrl}/add_request`, payload);
      console.log(response.data);
      refreshData();
      onClose();
    } catch (e: any) {
      console.error("wa");
    }
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
