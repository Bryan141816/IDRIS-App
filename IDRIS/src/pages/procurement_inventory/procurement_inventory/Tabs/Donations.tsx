import { useEffect, useState } from "react";
import { AddInventoryItemTab } from "./Modals/AddInventoryItem/AddInventoryItem";
import { EditInventoryModal } from "./Modals/EditInventoryItemModal/EditInventoryItemModal";
import { API } from "../../../../API_Handler/Axio_API_Handler";

export interface AvailableInKindItem {
  item_id: number;
  donor_name: string;
  item_description: string;
  donation_date: string; // ISO 8601 date string, e.g. "2025-10-20T12:11:52.431219+00:00"
}

export function formatDatePretty(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long", // e.g. October
    day: "numeric", // e.g. 20
  });
}
const Donations = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [inkindItem, setIndkindItem] = useState<AvailableInKindItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AvailableInKindItem | null>(
    null,
  );
  const openModal = (name: string, item: AvailableInKindItem | null = null) => {
    setActiveModal(name);
    setSelectedItem(item);
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
  };
  const fetchData = async () => {
    try {
      const response = await API.get("/procurement_inventory/get_all_inkind");
      return response.data;
    } catch (e: any) {
      console.error(`Error in fetching inventory item : ${e}`);
      return false;
    }
  };
  useEffect(() => {
    const handleFetch = async () => {
      const response = await fetchData();
      setIndkindItem(response);
    };
    handleFetch();
  }, []);

  const updateTable = () => {
    const handleFetch = async () => {
      const response = await fetchData();
      console.log(response);

      setIndkindItem(response);
    };
    handleFetch();
  };
  return (
    <>
      {activeModal === "add-inventory" && selectedItem && (
        <AddItemToInventory
          onClose={closeModal}
          items={selectedItem?.item_description}
          inkind_id={selectedItem.item_id}
          updateTable={updateTable}
        ></AddItemToInventory>
      )}
      <div className="inventory-content">
        <div className="section-header">
          <h2>Donations</h2>
        </div>

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Item Description</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {inkindItem.map((item) => (
                <tr key={item.item_id}>
                  <td>{item.donor_name}</td>
                  <td>{item.item_description}</td>
                  <td>{formatDatePretty(item.donation_date)}</td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => openModal("add-inventory", item)}
                    >
                      Add to Inventory
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

interface AddItemToInventoryProp {
  onClose: () => void;
  items: string;
  inkind_id: number;
  updateTable: () => void;
}
function parseItems(input: string): {
  item_name: string;
  category: string;
  quantity: number;
  batch: string;
  expiry: string;
}[] {
  const regex = /(\d+)\s*x\s*([A-Za-z\s]+)/gi;
  const result: {
    item_name: string;
    quantity: number;
    category: string;
    batch: string;
    expiry: string;
  }[] = [];

  let match;
  while ((match = regex.exec(input)) !== null) {
    const quantity = parseInt(match[1], 10);
    const item_name = match[2].trim();

    result.push({
      item_name,
      quantity,
      category: "",
      batch: "",
      expiry: "",
    });
  }

  return result;
}
const AddItemToInventory: React.FC<AddItemToInventoryProp> = ({
  onClose,
  items,
  inkind_id,
  updateTable,
}) => {
  const [donationsItem, setDonationsItem] = useState<
    {
      item_name: string;
      quantity: number;
      category: string;
      batch: string;
      expiry: string;
    }[]
  >([]);
  useEffect(() => {
    const parsedItem = parseItems(items);
    setDonationsItem(parsedItem);
  }, []);
  const handleChange = (
    index: number,
    field: "category" | "batch" | "expiry",
    value: string,
  ) => {
    setDonationsItem((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };
  const handleSubmit = () => {
    const submit = async () => {
      try {
        const response = await API.post(
          "/procurement_inventory/add_inventory_item_bulk",
          { inkind_id: inkind_id, items: donationsItem },
        );
        updateTable();
        onClose();
      } catch (e: any) {
        console.log("Error adding donations to inventory: " + e);
      }
    };
    submit();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 900 }}>
      <div
        className="modal"
        style={{
          zIndex: 990,
          width: "60%",
          maxWidth: "1000px",
        }}
      >
        <div className="modal-header">
          <h3>Add Item to Inventory</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="inventory-table">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Category</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {donationsItem.map((item, index) => (
                  <tr key={index}>
                    <td>{item.item_name}</td>
                    <td>{item.quantity}</td>

                    <td>
                      <select
                        name="category"
                        value={item.category}
                        onChange={(e) =>
                          handleChange(index, "category", e.target.value)
                        }
                      >
                        <option value="">Select category</option>
                        <option value="food">Food</option>
                        <option value="medical">Medical</option>
                        <option value="clothing">Clothing</option>
                        <option value="beverages">Beverages</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="text"
                        value={item.batch}
                        name="batch"
                        onChange={(e) =>
                          handleChange(index, "batch", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        value={item.expiry}
                        name="expiry"
                        onChange={(e) =>
                          handleChange(index, "expiry", e.target.value)
                        }
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
            Add Items
          </button>
        </div>
      </div>
    </div>
  );
};

export default Donations;
