import React, { useState } from "react"; 
import { Modal } from "../../../components/Page_Furniture/Modals"; 
import "../css/LGUmanagement.css";

const MapOfCebu = () => {
  const [activeTab, setActiveTab] = useState("lgu");

  // Example initial data
  const [lguData, setLguData] = useState([
    {
      id: 1,
      name: "Cebu City",
      lat: 10.313924,
      lng: 123.887082,
      population: "964,169",
      evacuationCenter: "Cebu City Sports Center",
      description: "Main city",
      resources: "Water, Power",
      image: "https://example.com/image.jpg",
    },
  ]);

  const [classificationData, setClassificationData] = useState([
    { id: 1, name: "Barangay 1", latitude: 10.31, longitude: 123.88, population: 5000, resources: "Water", evacuationCenter: "Evac Center 1", nearestEvacuationCenter: "Evac Center 2" },
  ]);

  const [hazardData, setHazardData] = useState([
    { id: 1, lat: 10.313, lng: 123.885, lguId: 1 },
  ]);

  const [evacuationData, setEvacuationData] = useState([
    { id: 1, name: "Cebu City Sports Center", lat: 10.31, lng: 123.88, capacity: "1000" },
  ]);

  const [raffiData, setRaffiData] = useState([
    {
      id: 1,
      name: "RAFI Infra A",
      lat: 10.35,
      lng: 123.91,
      description: "Warehouse and Transport Hub",
    },
  ]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);

  // Open modal for adding new item
  const handleAdd = (section: string) => {
    setEditSection(section);
    setEditItem(null); // null means add new
    setIsModalOpen(true);
  };

  // Open modal for editing existing item
  const handleEdit = (section: string, item: any) => {
    setEditSection(section);
    setEditItem(item);
    setIsModalOpen(true);
  };

  // Save new or updated item from modal form
  const handleModalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.currentTarget));
    console.log(`[MODAL SUBMIT - ${editSection?.toUpperCase()}]`, formData);

    const id = editItem?.id ?? Date.now(); // Use existing id or generate new

    // Helper to update or add item to data arrays
    const updateData = (data: any[], setter: React.Dispatch<React.SetStateAction<any[]>>) => {
      if (editItem) {
        // Editing: update item by id
        setter(data.map(d => (d.id === id ? { ...d, ...formData, id } : d)));
      } else {
        // Adding: append new item
        setter([...data, { ...formData, id }]);
      }
    };

    // Convert numbers if applicable (simple conversion for lat,lng, population, capacity)
    const parsedData = Object.entries(formData).reduce((acc, [k, v]) => {
      if (["lat", "lng", "latitude", "longitude"].includes(k)) acc[k] = parseFloat(v as string);
      else if (["population", "capacity", "lguId", "id"].includes(k)) acc[k] = Number(v);
      else acc[k] = v;
      return acc;
    }, {} as any);

    switch (editSection) {
      case "lgu":
        updateData(lguData, setLguData);
        break;
      case "classification":
        updateData(classificationData, setClassificationData);
        break;
      case "hazard":
        updateData(hazardData, setHazardData);
        break;
      case "evacuation":
        updateData(evacuationData, setEvacuationData);
        break;
      case "raffi":
        updateData(raffiData, setRaffiData);
        break;
      default:
        break;
    }

    setIsModalOpen(false);
    setEditItem(null);
    setEditSection(null);
  };

  // Helper to render modal form fields based on section
  const renderFormFields = () => {
  if (!editSection) return null;

  let fields: { name: string; label: string; type?: string; required?: boolean; multiline?: boolean }[] = [];

  switch (editSection) {
    case "lgu":
      fields = [
        { name: "name", label: "LGU Name", required: true },
        { name: "lat", label: "Latitude", type: "number", required: true },
        { name: "lng", label: "Longitude", type: "number", required: true },
        { name: "description", label: "Description", multiline: true },
        { name: "population", label: "Population" },
        { name: "resources", label: "Resources", multiline: true },
        { name: "evacuationCenter", label: "Evacuation Center" },
        { name: "image", label: "Image URL" },
      ];
      return (
        <div className="lgu-modal-form">
          {fields.map(({ name, label, type, required, multiline }) => (
            <div key={name} style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", fontWeight: "bold" }}>{label}</label>
              {multiline ? (
                <textarea
                  name={name}
                  defaultValue={editItem ? editItem[name] : ""}
                  required={required}
                  style={{ width: "100%" }}
                />
              ) : (
                <input
                  name={name}
                  type={type || "text"}
                  defaultValue={editItem ? editItem[name] : ""}
                  required={required}
                  style={{ width: "100%" }}
                />
              )}
            </div>
          ))}
        </div>
      );

    case "baranggay":
      fields = [
        { name: "name", label: "Barangay Name", required: true },
        { name: "latitude", label: "Latitude", type: "number", required: true },
        { name: "longitude", label: "Longitude", type: "number", required: true },
        { name: "population", label: "Population", type: "number" },
        { name: "resources", label: "Available Resources" },
        { name: "evacuationCenter", label: "Evacuation Center" },
        { name: "nearestEvacuationCenter", label: "Nearest Evacuation Center" },
      ];
      break;

    case "hazard":
      fields = [
        { name: "lat", label: "Latitude", required: true },
        { name: "lng", label: "Longitude", required: true },
        { name: "lguId", label: "LGU ID", type: "number" },
      ];
      break;

    case "evacuation":
      fields = [
        { name: "name", label: "Center Name" },
        { name: "lguId", label: "LGU ID", type: "number" },
        { name: "lat", label: "Latitude", type: "number" },
        { name: "lng", label: "Longitude", type: "number" },
        { name: "capacity", label: "Capacity" },
      ];
      break;

    case "raffi":
      fields = [
        { name: "name", label: "Infra Name" },
        { name: "description", label: "Description", multiline: true },
        { name: "lat", label: "Latitude", type: "number" },
        { name: "lng", label: "Longitude", type: "number" },
      ];
      break;

    default:
      return null;
  }

  // Default rendering for other sections (single column)
  return fields.map(({ name, label, type, required, multiline }) => (
    <div key={name} style={{ marginBottom: "0.5rem" }}>
      <label style={{ display: "block", fontWeight: "bold" }}>{label}</label>
      {multiline ? (
        <textarea
          name={name}
          defaultValue={editItem ? editItem[name] : ""}
          required={required}
          style={{ width: "100%" }}
        />
      ) : (
        <input
          name={name}
          type={type || "text"}
          defaultValue={editItem ? editItem[name] : ""}
          required={required}
          style={{ width: "100%" }}
        />
      )}
    </div>
  ));
};

  return (
    <div className="app-container">
      <div className="tabs">
        <button onClick={() => setActiveTab("lgu")}>LGU</button>
        <button onClick={() => setActiveTab("baranggay")}>Baranggay</button>
        <button onClick={() => setActiveTab("raffi")}>RAFI Infrastructure</button>
        <button onClick={() => setActiveTab("hazard")}>Hazard Mapping</button>
        <button onClick={() => setActiveTab("evacuation")}>Evacuation Center</button>
      </div>

      <div >
        {/* Add button */}
   <button
  className="add-button"
  onClick={() => handleAdd(activeTab)}
  style={{ marginBottom: "1rem" }}
>
  Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
</button>


        {activeTab === "lgu" && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Lat</th>
                <th>Lng</th>
                <th>Population</th>
                <th>Evac Center</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lguData.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.lat}</td>
                  <td>{item.lng}</td>
                  <td>{item.population}</td>
                  <td>{item.evacuationCenter}</td>
                  <td>
                    <button onClick={() => handleEdit("lgu", item)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "baranggay" && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Population</th>
                <th>Resources</th>
                <th>Evacuation Center</th>
                <th>Nearest Evacuation Center</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {classificationData.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.latitude}</td>
                  <td>{item.longitude}</td>
                  <td>{item.population}</td>
                  <td>{item.resources}</td>
                  <td>{item.evacuationCenter}</td>
                  <td>{item.nearestEvacuationCenter}</td>
                  <td>
                    <button onClick={() => handleEdit("baranggay", item)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "hazard" && (
          <table className="table">
            <thead>
              <tr>
                <th>Lat</th>
                <th>Lng</th>
                <th>LGU ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {hazardData.map((item) => (
                <tr key={item.id}>
                  <td>{item.lat}</td>
                  <td>{item.lng}</td>
                  <td>{item.lguId}</td>
                  <td>
                    <button onClick={() => handleEdit("hazard", item)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "evacuation" && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Lat</th>
                <th>Lng</th>
                <th>Capacity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {evacuationData.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.lat}</td>
                  <td>{item.lng}</td>
                  <td>{item.capacity}</td>
                  <td>
                    <button onClick={() => handleEdit("evacuation", item)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "raffi" && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Lat</th>
                <th>Lng</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {raffiData.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.lat}</td>
                  <td>{item.lng}</td>
                  <td>{item.description}</td>
                  <td>
                    <button onClick={() => handleEdit("raffi", item)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for add/edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>{editItem ? `Edit ${editSection?.toUpperCase()}` : `Add New ${editSection?.toUpperCase()}`}</h3>
        <form onSubmit={handleModalSubmit}>
          {renderFormFields()}
          <button type="submit" style={{ marginTop: "1rem" }}>
            Save
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MapOfCebu;
