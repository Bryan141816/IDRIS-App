import { RequestItem } from "../ProcurementDefaults";
import { useState } from "react";
import { formatCurrency, toTitleCase } from "../ProcurementDefaults";
interface RequestItemManagerProp {
  onAdd: (requestItem: Omit<RequestItem, "item_id">) => void;
  onDelete: (id: number) => void;
  requestItems: RequestItem[];
}

export const RequestItemManager: React.FC<RequestItemManagerProp> = ({
  onAdd,
  onDelete,
  requestItems,
}) => {
  const defaultItem: Omit<RequestItem, "item_id"> = {
    item_name: "",
    category: "",
    quantity: 0,
    price_p_each: 0,
  };
  const [item, setItem] = useState<Omit<RequestItem, "item_id">>(defaultItem);
  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) => {
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
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateRows: "repeat(3,1fr)",
          width: "100%",
          flexDirection: "row",
          gap: "5px",
        }}
      >
        <div>
          <label>Item Name</label>
          <input
            type="text"
            placeholder="Enter item name"
            name="item_name"
            value={item.item_name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Category</label>
          <select
            defaultValue=""
            name="category"
            value={item.category}
            onChange={handleChange}
          >
            <option value="">Select Category</option>
            <option value="medical supplies">Medical Supplies</option>
            <option value="equipment">Equipment</option>
            <option value="transportation">Transportation</option>
            <option value="office supplies">Office Supplies</option>
          </select>
        </div>
        <div>
          <label>Quantity</label>
          <input
            type="number"
            placeholder="Enter quantity"
            name="quantity"
            value={item.quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Price per item</label>
          <input
            type="number"
            placeholder="Enter item price"
            name="price_p_each"
            value={item.price_p_each}
            onChange={handleChange}
            required
          />
        </div>
        <button
          className="primary-btn"
          style={{
            width: "100%",
            whiteSpace: "nowrap",
            gridColumn: "span 2",
          }}
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
              fontWeight: "500",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                width: "100%",
                gap: "5px",
              }}
            >
              <span>Name: {item.item_name}</span>
              <span>Cat: {toTitleCase(item.category)}</span>
              <span>Qty: {item.quantity}</span>
              <span>Cost: {formatCurrency(item.price_p_each)}</span>
              <span>
                Total: {formatCurrency(item.price_p_each * item.quantity)}
              </span>
            </div>

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
