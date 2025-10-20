import { useEffect, useState } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import {
  WarehouseZone,
  InventoryItemsProps,
} from "../../../../procurement_inventory/Tabs/Modals/ModalDefault";
interface AddRouteModalProp {
  onClose: () => void;
  refreshTable: () => void;
}

interface Need {
  id: number;
  need: string;
  amount: string;
}

interface DemandAndResponse {
  address: string;
  title_label: string;
  status: string; // e.g. "no response"
  priority: string; // e.g. "medium"
  submitted_at: string; // ISO timestamp
  last_updated: string; // ISO timestamp
  demand_id: number;
  id: number;
  lat: number;
  lng: number;
  needs: Need[];
}

export const AddRouteModal: React.FC<AddRouteModalProp> = ({
  onClose,
  refreshTable,
}) => {
  const [formData, setFormData] = useState<{
    routeName: string;
    endLocation: string;
    schedule: string;
  }>({
    routeName: "",
    endLocation: "",
    schedule: "",
  });

  const [wareHousePicker, setWareHousePicker] = useState(false);
  const [responsePicker, setResponsePicker] = useState(false);
  const [selectedWareHouseZone, setSelectedWareHouseZone] =
    useState<WarehouseZone | null>(null);
  const [itemsPicker, setItemsPicker] = useState(false);
  const [selectedItems, setSelectedItem] = useState<
    { item: InventoryItemsProps; distributionQty: number }[]
  >([]);
  const [selectedResponse, setSelectedResponse] =
    useState<DemandAndResponse | null>(null);
  const setZone = (zone: WarehouseZone | null) => {
    setSelectedWareHouseZone(zone);
  };
  const setResponse = (response: DemandAndResponse | null) => {
    setSelectedResponse(response);
    if (response) {
      setFormData((prev) => ({
        ...prev,
        endLocation: response?.address,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        endLocation: "",
      }));
    }
  };
  const setItem = (
    items: { item: InventoryItemsProps; distributionQty: number }[],
  ) => {
    setSelectedItem(items);
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = () => {
    if (selectedWareHouseZone && selectedItems.length > 0) {
      const simplifiedItems = selectedItems.map(
        ({ item, distributionQty }) => ({
          inventory_id: item.inventory_id,
          distributionQty,
        }),
      );
      const Normalizeddata = {
        ...formData,
        warehouse_id: selectedWareHouseZone.warehouse_id,
        items: simplifiedItems,
      };
      const submit = async (data: any) => {
        try {
          const response = await API.post(
            "/distribution_planning/create_route",
            data,
          );
          refreshTable();
          onClose();
        } catch (e: any) {
          console.error("Error creating route: " + e);
        }
      };
      submit(Normalizeddata);
    }
  };
  return (
    <>
      {wareHousePicker && (
        <WareHousePicker
          onClose={() => setWareHousePicker(false)}
          selectedWarehouseZone={selectedWareHouseZone}
          setZone={setZone}
        ></WareHousePicker>
      )}
      {itemsPicker && selectedWareHouseZone && (
        <ItemsSelector
          onClose={() => setItemsPicker(false)}
          selectedItems={selectedItems}
          warehouse_id={selectedWareHouseZone.warehouse_id}
          setItems={setItem}
        ></ItemsSelector>
      )}
      {responsePicker && (
        <ResponseModal
          onClose={() => setResponsePicker(false)}
          selectedResponse={selectedResponse}
          setResponse={setResponse}
        ></ResponseModal>
      )}
      <div className="modal-overlay" style={{ zIndex: 900 }}>
        <div className="modal">
          <div className="modal-header">
            <h3>Create New Route</h3>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-content">
            <div className="form-group">
              <label>Route Name</label>
              <input
                type="text"
                placeholder="Enter route name"
                value={formData.routeName}
                name="routeName"
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Start Location</label>
              <div>
                <input
                  type="text"
                  placeholder="Starting point"
                  disabled
                  value={
                    selectedWareHouseZone ? selectedWareHouseZone.zone_name : ""
                  }
                />
                <button
                  className="secondary-btn"
                  style={{ width: "100%" }}
                  onClick={() => setWareHousePicker(true)}
                >
                  Select Location
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Distribution Items</label>
              <button
                className="secondary-btn"
                style={{ width: "100%" }}
                onClick={() => setItemsPicker(true)}
              >
                Edit Items
              </button>
            </div>
            <div className="form-group">
              <label>End Location</label>
              <div>
                <input
                  type="text"
                  placeholder="End point"
                  disabled
                  value={selectedResponse ? selectedResponse.address : ""}
                />
                <button
                  className="secondary-btn"
                  style={{ width: "100%" }}
                  onClick={() => setResponsePicker(true)}
                >
                  Select Location
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Schedule</label>
              <input
                type="datetime-local"
                value={formData.schedule}
                name="schedule"
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn" onClick={handleSubmit}>
              Create Route
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

interface WareHousePickerProp {
  onClose: () => void;
  selectedWarehouseZone: WarehouseZone | null;
  setZone: (zone: WarehouseZone | null) => void;
}

const WareHousePicker: React.FC<WareHousePickerProp> = ({
  onClose,
  selectedWarehouseZone,
  setZone,
}) => {
  const [wareHouseZone, setWareHouseZone] = useState<WarehouseZone[]>([]);
  const fetchData = async () => {
    try {
      const response = await API.get(
        "/procurement_inventory/get_warehouse_zone",
      );
      setWareHouseZone(response.data);
    } catch (e: any) {
      console.error("error fetching volunteer: " + e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const [selectedZone, setSelectedZone] = useState<WarehouseZone | null>(
    selectedWarehouseZone,
  );

  const handleCheckboxChange = (zone: WarehouseZone) => {
    // If the clicked row is already selected, deselect it
    if (selectedZone?.warehouse_id === zone.warehouse_id) {
      setSelectedZone(null);
    } else {
      setSelectedZone(zone);
    }
  };
  const handleSelect = () => {
    setZone(selectedZone);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal"
        style={{
          zIndex: 990,
          width: "60%",
          maxWidth: "1000px",
        }}
      >
        <div className="modal-header">
          <h3>Select Starting Location</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {wareHouseZone && (
            <div style={{ width: "100%" }}>
              <table style={{ width: "100%" }}>
                <thead
                  style={{
                    textAlign: "start",
                    padding: "10px",
                    backgroundColor: "#749ab6",
                    color: "white",
                  }}
                >
                  <tr>
                    <th>{"  "}</th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Name
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Zone Type
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wareHouseZone.map((zone) => (
                    <tr
                      key={zone.warehouse_id}
                      style={{
                        backgroundColor:
                          selectedZone?.warehouse_id === zone.warehouse_id
                            ? "#e3f2fd"
                            : "transparent",
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={
                            selectedZone?.warehouse_id === zone.warehouse_id
                          }
                          onChange={() => handleCheckboxChange(zone)}
                        />
                      </td>
                      <td style={{ padding: "10px" }}>{zone.zone_name}</td>
                      <td style={{ padding: "10px" }}>{zone.zone_type}</td>
                      <td style={{ padding: "10px" }}>{zone.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSelect}>
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

interface ItemsSelectorProps {
  onClose: () => void;
  selectedItems: { item: InventoryItemsProps; distributionQty: number }[];
  warehouse_id: number;
  setItems: (
    items: { item: InventoryItemsProps; distributionQty: number }[],
  ) => void;
}

const ItemsSelector: React.FC<ItemsSelectorProps> = ({
  onClose,
  selectedItems,
  warehouse_id,
  setItems,
}) => {
  const [inventory, setInventory] = useState<InventoryItemsProps[]>([]);
  const [selected, setSelected] =
    useState<{ item: InventoryItemsProps; distributionQty: number }[]>(
      selectedItems,
    );

  const fetchData = async () => {
    try {
      const response = await API.get(
        `/distribution_planning/get_warehouse_items?warehouse_id=${warehouse_id}`,
      );
      setInventory(response.data);
    } catch (e: any) {
      console.error("error fetching Inventory: " + e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle checkbox toggle
  const handleSelectItem = (item: InventoryItemsProps, checked: boolean) => {
    if (checked) {
      // Add to selected
      setSelected((prev) => [
        ...prev,
        { item, distributionQty: 0 }, // default quantity 0
      ]);
    } else {
      // Remove if unchecked
      setSelected((prev) =>
        prev.filter((s) => s.item.inventory_id !== item.inventory_id),
      );
    }
  };

  // Handle distribution quantity change
  const handleQtyChange = (itemId: number, value: number) => {
    setSelected((prev) =>
      prev.map((s) =>
        s.item.inventory_id === itemId ? { ...s, distributionQty: value } : s,
      ),
    );
  };

  // Check if item is selected
  const isItemSelected = (itemId: number) =>
    selected.some((s) => s.item.inventory_id === itemId);

  // Get distribution qty
  const getDistributionQty = (itemId: number) =>
    selected.find((s) => s.item.inventory_id === itemId)?.distributionQty || 0;

  const handleSelect = () => {
    if (selected.length <= 0) {
      return;
    }
    const invalid = selected.some(
      (s) => !s.distributionQty || s.distributionQty <= 0,
    );
    if (invalid) {
      alert(
        "Please enter a valid distribution quantity for all selected items.",
      );
      return;
    }
    setItems(selected);
    onClose();
  };
  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal"
        style={{
          zIndex: 990,
          width: "80%",
          maxWidth: "1200px",
        }}
      >
        <div className="modal-header">
          <h3>Select Items for Distribution</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {inventory && (
            <div style={{ width: "100%" }}>
              <table style={{ width: "100%" }}>
                <thead
                  style={{
                    textAlign: "start",
                    padding: "10px",
                    backgroundColor: "#749ab6",
                    color: "white",
                  }}
                >
                  <tr>
                    <th>{"  "}</th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Distribution Quantity
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Name
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Quantity
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Category
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Batch
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Expiry
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.inventory_id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isItemSelected(item.inventory_id)}
                          onChange={(e) =>
                            handleSelectItem(item, e.target.checked)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={getDistributionQty(item.inventory_id)}
                          onChange={(e) =>
                            handleQtyChange(
                              item.inventory_id,
                              Number(e.target.value),
                            )
                          }
                          disabled={!isItemSelected(item.inventory_id)}
                          required={isItemSelected(item.inventory_id)}
                          min={0}
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td style={{ padding: "10px" }}>{item.item_name}</td>
                      <td style={{ padding: "10px" }}>{item.quantity}</td>
                      <td style={{ padding: "10px" }}>{item.category}</td>
                      <td style={{ padding: "10px" }}>{item.batch}</td>
                      <td style={{ padding: "10px" }}>{item.expiry}</td>
                      <td style={{ padding: "10px" }}>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSelect}>
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

interface ResponseProp {
  onClose: () => void;
  selectedResponse: DemandAndResponse | null;
  setResponse: (response: DemandAndResponse | null) => void;
}

const ResponseModal: React.FC<ResponseProp> = ({
  onClose,
  selectedResponse,
  setResponse,
}) => {
  const [responseList, setResponseList] = useState<DemandAndResponse[]>([]);
  const fetchData = async () => {
    try {
      const response = await API.get("/distribution_planning/get_all_response");
      setResponseList(response.data);
    } catch (e: any) {
      console.error("error fetching volunteer: " + e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const [responseItem, setResponseItem] = useState<DemandAndResponse | null>(
    selectedResponse,
  );

  const handleCheckboxChange = (response: DemandAndResponse) => {
    // If the clicked row is already selected, deselect it
    if (responseItem?.id === response.id) {
      setResponseItem(null);
    } else {
      setResponseItem(response);
    }
  };
  const handleSelect = () => {
    setResponse(responseItem);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal"
        style={{
          zIndex: 990,
          width: "60%",
          maxWidth: "1000px",
        }}
      >
        <div className="modal-header">
          <h3>Select Starting Location</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {responseList && (
            <div style={{ width: "100%" }}>
              <table style={{ width: "100%" }}>
                <thead
                  style={{
                    textAlign: "start",
                    padding: "10px",
                    backgroundColor: "#749ab6",
                    color: "white",
                  }}
                >
                  <tr>
                    <th>{"  "}</th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Title
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Address
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {responseList.map((response) => (
                    <tr
                      key={response.id}
                      style={{
                        backgroundColor:
                          responseItem?.id === response.id
                            ? "#e3f2fd"
                            : "transparent",
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={responseItem?.id === response.id}
                          onChange={() => handleCheckboxChange(response)}
                        />
                      </td>
                      <td style={{ padding: "10px" }}>
                        {response.title_label}
                      </td>
                      <td style={{ padding: "10px" }}>{response.address}</td>
                      <td style={{ padding: "10px" }}>{response.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSelect}>
            Select
          </button>
        </div>
      </div>
    </div>
  );
};
