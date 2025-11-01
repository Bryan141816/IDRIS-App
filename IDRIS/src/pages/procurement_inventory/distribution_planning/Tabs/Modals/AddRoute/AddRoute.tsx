import React, { useEffect, useState } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import {
  WarehouseZone,
  InventoryItemsProps,
} from "../../../../procurement_inventory/Tabs/Modals/ModalDefault";
import { MapViewWithSearch } from "../../../../procurement_inventory/Tabs/MapViewWithSearch";
import { ProcurementRequest } from "../../../../procurement_management/Tabs/Modals/ProcurementDefaults";
interface AddRouteModalProp {
  onClose: () => void;
  refreshTable: () => void;
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
export const AddRouteModal: React.FC<AddRouteModalProp> = ({
  onClose,
  refreshTable,
}) => {
  type formDataType = {
    route_name: string;
    gathering_area_name: string;
    gathering_area_lat: number;
    gathering_area_lng: number;
    delivery_id: number;
  };
  const defaultFormData = {
    route_name: "",
    gathering_area_name: "",
    gathering_area_lat: -1000000,
    gathering_area_lng: -1000000,
    delivery_id: -1,
  };
  const [requestItems, setRequestItems] = useState<requestItemsType[]>([]);

  const [formData, setFormData] = useState<formDataType>(defaultFormData);
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [openMapViewSelect, setOpenMapViewSelect] = useState(false);
  const [openDeliveryPicker, setOpenDeliveryPicker] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ProcurementRequest | null>(null);

  const [requestList, setRequestList] = useState<
    (requestItemsType & StorageInfo)[]
  >([]);

  const handleMapSubmit = (address: string, coordinates: [number, number]) => {
    setFormData((prev) => ({
      ...prev,
      gathering_area_name: address,
      gathering_area_lat: coordinates[0],
      gathering_area_lng: coordinates[1],
    }));
  };
  const handleDeliverSubmit = (request: ProcurementRequest) => {
    setFormData((prev) => ({
      ...prev,
      delivery_id: request.request_id,
    }));

    setSelectedDelivery(
      `${request.end_target?.name ? `${request.end_target.name}, ` : ""}${request.lgu.name}, Cebu`,
    );
    setSelectedRequest(request);
    setRequestItems(request.items);
  };
  const onHandlSubmit = () => {
    console.log(requestList);
  };
  return (
    <>
      {openMapViewSelect && (
        <MapViewWithSearch
          onClose={() => setOpenMapViewSelect(false)}
          onSubmit={handleMapSubmit}
          defaultValue={{
            address: formData.gathering_area_name,
            coordinates: [
              formData.gathering_area_lat,
              formData.gathering_area_lng,
            ],
          }}
        ></MapViewWithSearch>
      )}
      {openDeliveryPicker && (
        <DileveryLocationPicker
          onClose={() => setOpenDeliveryPicker(false)}
          onSubmit={handleDeliverSubmit}
        ></DileveryLocationPicker>
      )}
      <div className="modal-overlay" style={{ zIndex: 900 }}>
        <div className="modal " style={{ minWidth: "50vw" }}>
          <div className="modal-header">
            <h3>Create New Route</h3>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-content">
            <div className="form-group">
              <label>Route Name:</label>
              <input
                type="text"
                value={formData.route_name}
                onChange={(e) => {
                  const { value } = e.target;
                  setFormData((prev) => ({
                    ...prev,
                    route_name: value,
                  }));
                }}
              />
            </div>
            <div className="form-group">
              <label>Gathering Area:</label>
              <input
                type="text"
                disabled
                value={formData.gathering_area_name}
              />
              <button
                className="secondary-btn"
                style={{ width: "100%" }}
                onClick={() => setOpenMapViewSelect(true)}
              >
                Select Location
              </button>
            </div>
            <div className="form-group">
              <label>Delivery Location:</label>
              <input type="text" disabled value={selectedDelivery} />
              <button
                className="secondary-btn"
                style={{ width: "100%" }}
                onClick={() => setOpenDeliveryPicker(true)}
              >
                Select Location
              </button>
            </div>
            {selectedRequest && requestItems && (
              <div className="form-group">
                <label>Request Items:</label>
                <RequestItemsHandler
                  requestItems={requestItems}
                  setRequestListState={setRequestList}
                ></RequestItemsHandler>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn" onClick={onHandlSubmit}>
              Create Route
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

interface DileveryLocationPickerProp {
  onClose: () => void;
  selected_id?: number;
  onSubmit: (request: ProcurementRequest) => void;
}
const DileveryLocationPicker: React.FC<DileveryLocationPickerProp> = ({
  onClose,
  selected_id,
  onSubmit,
}) => {
  const [requestList, setRequestList] = useState<ProcurementRequest[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await API.get("/distribution_planning/get_request");
        setRequestList(response.data);
      } catch (e: any) {
        console.error("Error fetching delivery location: " + e.message);
      }
    };
    fetch();
  }, []);
  const checkBoxHandle = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedIndex(index);
    } else {
      setSelectedIndex(-1);
    }
  };
  const handleSubmit = () => {
    const request = requestList[selectedIndex];
    onSubmit(request);
    onClose();
  };
  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal " style={{ minWidth: "50vw" }}>
        <div className="modal-header">
          <h3>Select Delivery Location</h3>
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
                  <th style={{ textAlign: "start", padding: "10px" }}></th>
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Location
                  </th>
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Date Requested
                  </th>
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Date Needed
                  </th>
                </tr>
              </thead>
              <tbody>
                {requestList.length > 0 &&
                  requestList.map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        background:
                          selectedIndex === index
                            ? "rgb(169 214 247)"
                            : "transparent",
                      }}
                    >
                      <td style={{ padding: "10px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIndex === index}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            checkBoxHandle(index, e.target.checked);
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px" }}>
                        {item.end_target && `${item.end_target.name}, `}
                        {item.lgu.name}, Cebu
                      </td>
                      <td style={{ padding: "10px" }}>{item.date_requested}</td>
                      <td style={{ padding: "10px" }}>{item.date_needed}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSubmit}>
            Select Location
          </button>
        </div>
      </div>
    </div>
  );
};

type StorageInfo = {
  assigned_id: number;
  inventory_name: string;
  warehouse_name: string;
  quantity_assigned: number;
};
interface RequestItemsHandlerProp {
  requestItems: requestItemsType[];
  setRequestListState: React.Dispatch<
    React.SetStateAction<(requestItemsType & StorageInfo)[]>
  >;
}

const RequestItemsHandler: React.FC<RequestItemsHandlerProp> = ({
  requestItems,
  setRequestListState,
}) => {
  const [requestList, setRequestList] = useState<
    (requestItemsType & StorageInfo)[]
  >([]);
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

  useEffect(() => {
    const mapped = requestItems.map((item) => ({
      item_id: item.item_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      assigned_id: -1,
      inventory_name: "",
      warehouse_name: "",
      quantity_assigned: -1,
    }));

    setRequestList(mapped); // ✅ set all at once
  }, [requestItems]);
  const handlePickInventorySubmit = (index: number, inventory: StorageInfo) => {
    setRequestList((prev) =>
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
  useEffect(() => {
    setRequestListState(requestList);
  }, [requestList]);
  return (
    <>
      {openPickInventory && selectedRequest && (
        <PickInventoryModal
          onClose={closeInventory}
          item={selectedRequest}
          index={requestIndexPicked}
          onSubmit={handlePickInventorySubmit}
        ></PickInventoryModal>
      )}
      <div style={{ background: "white", width: "100%" }}>
        <table style={{ width: "100%" }}>
          <thead
            style={{
              background: "linear-gradient(135deg, #749ab6 0%, #5a8aa8 100%)",
              color: "white",
            }}
          >
            <tr>
              <th style={{ textAlign: "start", padding: "10px" }}>Items</th>
              <th style={{ textAlign: "start", padding: "10px" }}>
                Quantity Needed
              </th>
              <th style={{ textAlign: "start", padding: "10px" }}>
                Inventory Name
              </th>
              <th style={{ textAlign: "start", padding: "10px" }}>Quantity</th>
              <th style={{ textAlign: "start", padding: "10px" }}>Warehouse</th>
              <th style={{ textAlign: "start", padding: "10px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requestList.length > 0 &&
              requestList.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: "10px" }}>{item.name}</td>
                  <td style={{ padding: "10px" }}>{item.quantity}</td>
                  <td style={{ padding: "10px" }}>{item.inventory_name}</td>
                  <td style={{ padding: "10px" }}>
                    {item.quantity_assigned !== -1
                      ? item.quantity_assigned
                      : ""}
                  </td>
                  <td style={{ padding: "10px" }}>{item.warehouse_name}</td>
                  <td style={{ padding: "10px", width: "fit-content" }}>
                    <button
                      className="action-btn"
                      style={{ width: "fit-content" }}
                      onClick={() => openInventory(item, index)}
                    >
                      Pick from inventory
                    </button>
                  </td>
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
}

const PickInventoryModal: React.FC<PickInventoryModalProp> = ({
  onClose,
  item,
  index,
  onSubmit,
}) => {
  const [responseData, setResponseData] = useState<AssignedStorageItem[]>([]);
  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await API.get(
          `/distribution_planning/get_assigned?category=${item.category}`,
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
                  <th style={{ textAlign: "start", padding: "10px" }}></th>
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
                  <th style={{ textAlign: "start", padding: "10px" }}>
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {responseData.length > 0 &&
                  responseData.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: "10px" }}>
                        <input
                          type="checkbox"
                          checked={index === selectedIndex}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handlCheckChange(index, e.target.checked)
                          }
                        />
                      </td>
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
                            setQuantityInput(value);
                          }}
                          disabled={selectedIndex !== index}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSubmit}>
            Select Item
          </button>
        </div>
      </div>
    </div>
  );
};
