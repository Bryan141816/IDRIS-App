import React, { useEffect, useState, useRef } from "react";
import { Modal } from "../../../components/Page_Furniture/Modals";
import "../css/LGUmanagement.css";
import { Link } from "react-router-dom";
import "../../response_dashboard/DefaultListViewStyle.scss";
import { TableView } from "../../../components/TableView/table_view";
import { API } from "../../../API_Handler/Axio_API_Handler";
import { TableReponse } from "../../../components/TableView/table_view";
//API Handler
export async function getRecord(record_type: string): Promise<any> {
  const response = await API.get(
    `/lgu_profiling/manage_lgu/get_${record_type}`,
  );
  return response.data;
}

export async function addResponseReport(reportType: string): Promise<any> {
  const response = await API.post(
    "/response_dashboard/report_list/add_report",
    {
      report_type: reportType,
      status: "Filed",
    },
  );
  return response.data;
}

export async function deleteResponseReport(reportId: String): Promise<any> {
  try {
    const response = await API.delete(
      `/response_dashboard/report_list/delete_report/${reportId}`,
    );
    return response;
  } catch (error: any) {
    if (error.response) {
      console.error("Error: ", error.response.data.detail);
    } else {
      console.error("Request error: ", error.message);
    }
  }
}

export async function updateResponseReport(
  reportId: String,
  report_type: String,
  report_status: String,
) {
  try {
    const response = await API.put(
      `/response_dashboard/report_list/update_report/${reportId}`,
      {
        report_type: report_type,
        status: report_status,
      },
    );
    return { sucess: true, data: response.data };
  } catch (error: any) {
    if (error.respose) {
      console.error("Error: ", error.response.data.detail);
      return {
        sucess: false,
        error: error.response?.data?.detail || error.message,
      };
    } else {
      console.error("Request error: ", error.message);
      return { sucess: false, error: "An unexpected error occured." };
    }
  }
}

//

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
    {
      id: 1,
      name: "Barangay 1",
      latitude: 10.31,
      longitude: 123.88,
      population: 5000,
      resources: "Water",
      evacuationCenter: "Evac Center 1",
      nearestEvacuationCenter: "Evac Center 2",
    },
  ]);

  const [hazardData, setHazardData] = useState([
    { id: 1, lat: 10.313, lng: 123.885, lguId: 1 },
  ]);

  const [evacuationData, setEvacuationData] = useState([
    {
      id: 1,
      name: "Cebu City Sports Center",
      lat: 10.31,
      lng: 123.88,
      capacity: "1000",
    },
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

    const id = editItem?.id ?? Date.now(); // Use existing id or generate new

    // Helper to update or add item to data arrays
    const updateData = (
      data: any[],
      setter: React.Dispatch<React.SetStateAction<any[]>>,
    ) => {
      if (editItem) {
        // Editing: update item by id
        setter(data.map((d) => (d.id === id ? { ...d, ...formData, id } : d)));
      } else {
        // Adding: append new item
        setter([...data, { ...formData, id }]);
      }
    };

    // Convert numbers if applicable (simple conversion for lat,lng, population, capacity)
    const parsedData = Object.entries(formData).reduce((acc, [k, v]) => {
      if (["lat", "lng", "latitude", "longitude"].includes(k))
        acc[k] = parseFloat(v as string);
      else if (["population", "capacity", "lguId", "id"].includes(k))
        acc[k] = Number(v);
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

    let fields: {
      name: string;
      label: string;
      type?: string;
      required?: boolean;
      multiline?: boolean;
    }[] = [];

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
                <label style={{ display: "block", fontWeight: "bold" }}>
                  {label}
                </label>
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
          {
            name: "latitude",
            label: "Latitude",
            type: "number",
            required: true,
          },
          {
            name: "longitude",
            label: "Longitude",
            type: "number",
            required: true,
          },
          { name: "population", label: "Population", type: "number" },
          { name: "resources", label: "Available Resources", multiline: true },
          { name: "evacuationCenter", label: "Evacuation Center" },
          {
            name: "nearestEvacuationCenter",
            label: "Nearest Evacuation Center",
          },
        ];

        return (
          <div className="lgu-modal-form">
            {fields.map(({ name, label, type, required, multiline }) => (
              <div key={name} style={{ marginBottom: "0.5rem" }}>
                <label style={{ display: "block", fontWeight: "bold" }}>
                  {label}
                </label>
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
  const [responseData, setResponseData] = useState<TableReponse | null>(null);
  const refreshTable = useRef<() => void>(() => {});
  async function fetchData(name: string) {
    try {
      const response = await getRecord(name);
      setResponseData(response);
    } catch (error) {
      console.error(error);
    }
  }
  const [currentTabName, setCurrentTabName] = useState("LGU");
  const handleRefreshTable = () => refreshTable.current?.();

  useEffect(() => {
    fetchData(activeTab);
    handleRefreshTable();
    switch (activeTab) {
      case "lgu":
        setCurrentTabName("LGU");
        break;
      case "barangay":
        setCurrentTabName("Barangay");
        break;
      case "rafi":
        setCurrentTabName("RAFI Infrastructure");
        break;
      case "hazard":
        setCurrentTabName("Hazard Data");
        break;
      case "evacuation":
        setCurrentTabName("Evacuation Center");
        break;
    }
  }, [activeTab]);
  return (
    <div className="app-container">
      <div className="horizontal-container">
        <div className="navigator-container">
          <Link to="/response_dashboard">Response Dashboard</Link>
          <h3>/Report List</h3>
        </div>
        <div className="table-actions">
          <input type="text" placeholder="Search report"></input>
          <button>Search</button>
          <button>+ Add {currentTabName}</button>
        </div>
      </div>
      <div className="tabs">
        <button onClick={() => setActiveTab("lgu")}>LGU</button>
        <button onClick={() => setActiveTab("barangay")}>Baranggay</button>
        <button onClick={() => setActiveTab("rafi")}>
          RAFI Infrastructure
        </button>
        <button onClick={() => setActiveTab("hazard")}>Hazard Mapping</button>
        <button onClick={() => setActiveTab("evacuation")}>
          Evacuation Center
        </button>
      </div>

      <div>
        {responseData ? (
          <TableView
            tableJSON={responseData}
            onClickCallback={(row: any) => {}}
            setCallbackTableData={true}
            pageRequest={`/lgu_profiling/manage_lgu/get_${activeTab}?page=`}
            updateTable={(fn) => (refreshTable.current = fn)}
          />
        ) : (
          <div>Loading data...</div>
        )}
      </div>
    </div>
  );
};

export default MapOfCebu;
