import React, { useState, useEffect } from "react";
import { TableView } from "../../../components/TableView/table_view";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox";
import { API } from "../../../API_Handler/Axio_API_Handler";
import "../css/LGUmanagement.css";

// ------- API Helpers -------
type RecordPayload = { [k: string]: any };

async function getRecord(record_type: string) {
  const response = await API.get(`/lgu_profiling/manage_lgu/get_${record_type}`);
  return response.data;
}

// Image upload for barangay/lgu uses its own endpoint, RAFI uses another
async function uploadPic(file: File, type: "barangay" | "lgu" | "rafi") {
  const folder =
    type === "barangay"
      ? "barangay_pictures"
      : type === "lgu"
      ? "lgu_pictures"
      : "rafi_pictures";
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await API.post(`/api/files/${folder}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.url ?? null;
  } catch {
    return null;
  }
}

// Add record: Barangay and LGU accept JSON, RAFI accepts FormData
async function addRecord(record_type: string, payload: RecordPayload) {
  let url = `/lgu_profiling/manage_lgu/add_${record_type}`;
  let config = {};
  // For RAFI, use FormData and multipart
  if (record_type === "rafi") {
    config = { headers: { "Content-Type": "multipart/form-data" } };
    return await API.post(url, payload, config).then((response) =>
      response.data
    ).catch((error: any) => ({
      success: false,
      error:
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Unknown error occurred"
    }));
  } else {
    // For Barangay and LGU, normal JSON post
    return await API.post(url, payload).then((response) =>
      response.data
    ).catch((error: any) => ({
      success: false,
      error:
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Unknown error occurred"
    }));
  }
}

// ------- Unified Modal for Add Pin -------
type AddPinModalProps = {
  isOpen: boolean,
  onClose: () => void,
  handleAddPin: (type: string, data: RecordPayload) => void,
};

const AddPinModal: React.FC<AddPinModalProps> = ({ isOpen, onClose, handleAddPin }) => {
  const [pinType, setPinType] = useState<string>("");
  const [fields, setFields] = useState<RecordPayload>({});
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { setFields({}); setFile(null); }, [pinType, isOpen]);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const renderFields = () => {
    if (pinType === "barangay") {
      return (
        <>
          <input placeholder="Barangay Name" value={fields.name || ""} onChange={e => setFields(f => ({ ...f, name: e.target.value }))} />
          <input placeholder="Latitude" type="number" value={fields.lat || ""} step="any" onChange={e => setFields(f => ({ ...f, lat: e.target.value }))} />
          <input placeholder="Longitude" type="number" value={fields.lng || ""} step="any" onChange={e => setFields(f => ({ ...f, lng: e.target.value }))} />
          <input placeholder="LGU" value={fields.LGU || ""} onChange={e => setFields(f => ({ ...f, LGU: e.target.value }))} />
          <input placeholder="Evacuation Center" value={fields.evacuation || ""} onChange={e => setFields(f => ({ ...f, evacuation: e.target.value }))} />
          <input placeholder="Population" type="number" value={fields.population || ""} min={0} onChange={e => setFields(f => ({ ...f, population: e.target.value }))} />
          <input placeholder="Contact Info" value={fields.contact_info || ""} onChange={e => setFields(f => ({ ...f, contact_info: e.target.value }))} />
          <select value={fields.risk_level || ""} onChange={e => setFields(f => ({ ...f, risk_level: e.target.value }))}>
            <option value="">Risk Level</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <textarea placeholder="Barangay Description" value={fields.baranggay_desc || ""} onChange={e => setFields(f => ({ ...f, baranggay_desc: e.target.value }))}/>
          <input type="file" accept="image/*" onChange={handlePicChange} />
        </>
      );
    }
    if (pinType === "lgu") {
      return (
        <>
          <input placeholder="LGU Name" value={fields.name || ""} onChange={e => setFields(f => ({ ...f, name: e.target.value }))} />
          <input placeholder="Latitude" type="number" value={fields.lat || ""} step="any" onChange={e => setFields(f => ({ ...f, lat: e.target.value }))} />
          <input placeholder="Longitude" type="number" value={fields.lng || ""} step="any" onChange={e => setFields(f => ({ ...f, lng: e.target.value }))} />
          <select value={fields.classification || ""} onChange={e => setFields(f => ({ ...f, classification: e.target.value }))}>
            <option value="">Classification</option>
            <option value="province">Province</option>
            <option value="city">City</option>
            <option value="municipality">Municipality</option>
            <option value="barangay">Barangay</option>
          </select>
          <input placeholder="Population" type="number" value={fields.population || ""} min={0} onChange={e => setFields(f => ({ ...f, population: e.target.value }))} />
          <input placeholder="Contact Info" value={fields.contact_info || ""} onChange={e => setFields(f => ({ ...f, contact_info: e.target.value }))} />
          <select value={fields.risk_level || ""} onChange={e => setFields(f => ({ ...f, risk_level: e.target.value }))}>
            <option value="">Risk Level</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <textarea placeholder="Description" value={fields.description || ""} onChange={e => setFields(f => ({ ...f, description: e.target.value }))}/>
          <input type="file" accept="image/*" onChange={handlePicChange} />
          <input placeholder="Resources (comma separated)" value={fields.resources || ""} onChange={e => setFields(f => ({ ...f, resources: e.target.value }))} />
          <input placeholder="Players (comma separated)" value={fields.players || ""} onChange={e => setFields(f => ({ ...f, players: e.target.value }))} />
          <input placeholder="Schools (comma separated)" value={fields.schools || ""} onChange={e => setFields(f => ({ ...f, schools: e.target.value }))} />
          <input placeholder="Gyms (comma separated)" value={fields.gyms || ""} onChange={e => setFields(f => ({ ...f, gyms: e.target.value }))} />
          <input placeholder="Local Suppliers (comma separated)" value={fields.local_suppliers || ""} onChange={e => setFields(f => ({ ...f, local_suppliers: e.target.value }))} />
        </>
      );
    }
    if (pinType === "rafi") {
      return (
        <>
          <input placeholder="RAFI Infrastructure Name" value={fields.name || ""} onChange={e => setFields(f => ({ ...f, name: e.target.value }))} />
          <input placeholder="Latitude" type="number" value={fields.lat || ""} step="any" onChange={e => setFields(f => ({ ...f, lat: e.target.value }))} />
          <input placeholder="Longitude" type="number" value={fields.lng || ""} step="any" onChange={e => setFields(f => ({ ...f, lng: e.target.value }))} />
          <textarea placeholder="Description" value={fields.rafi_desc || ""} onChange={e => setFields(f => ({ ...f, rafi_desc: e.target.value }))}/>
          <input type="file" accept="image/*" onChange={handlePicChange} />
        </>
      );
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinType) return alert("Please select a type.");
    let payload: RecordPayload = { ...fields };

    // Image upload logic for each type
    if (file) {
      const picUrl = await uploadPic(file, pinType as "barangay" | "lgu" | "rafi");
      if (!picUrl) return alert("Image upload failed.");
      if (pinType === "barangay") payload.baranggay_pic = picUrl;
      if (pinType === "lgu") payload.lgu_picture = picUrl;
      if (pinType === "rafi") payload.rafi_pic = file; // send the raw file, handled as FormData
    }
    // LGU array field conversion
    if (pinType === "lgu") {
      ["resources", "players", "schools", "gyms", "local_suppliers"].forEach((fld) => {
        payload[fld] = payload[fld]
          ? payload[fld].split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];
      });
    }
    handleAddPin(pinType, payload);
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-modal" onClick={onClose}>✕</button>
        <h2>Add Pin Details</h2>
        <label>
          Select Type
          <select value={pinType} onChange={e => setPinType(e.target.value)}>
            <option value="">-- Select --</option>
            <option value="barangay">Barangay</option>
            <option value="lgu">LGU</option>
            <option value="rafi">RAFI Infrastructure</option>
          </select>
        </label>
        <form onSubmit={onSubmit}>
          {renderFields()}
          <div style={{ display: 'flex', marginTop: 25, gap: 16, justifyContent: 'flex-end' }}>
            <button className="submit-btn" type="submit">Submit</button>
            <button className="cancel-btn" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --------- Main Parent Component ---------
const ManagePins: React.FC = () => {
  const [lguResponse, setLguResponse] = useState<any>(null);
  const [barangayResponse, setBarangayResponse] = useState<any>(null);
  const [rafiResponse, setRafiResponse] = useState<any>(null);

  const [addPinOpen, setAddPinOpen] = useState(false);
  const [messageBox, setMessageBox] = useState({
    isOpen: false, type: "message", message: "", onSubmit: undefined,
    onClose: () => setMessageBox(prev => ({ ...prev, isOpen: false }))
  });

  const fetchAll = async () => {
    setLguResponse(await getRecord("lgu"));
    setBarangayResponse(await getRecord("barangay"));
    setRafiResponse(await getRecord("rafi"));
  };
  useEffect(() => { fetchAll(); }, []);

  const handleAddPin = async (type: string, data: RecordPayload) => {
    let resp;
    if (type === "rafi") {
      // RAFI expects FormData
      const fd = new FormData();
      fd.append("rafi_name", data.name || "");
      if (data.lat) fd.append("lat", String(data.lat));
      if (data.lng) fd.append("lng", String(data.lng));
      fd.append("rafi_desc", data.rafi_desc || "");
      if (data.rafi_pic) fd.append("rafi_pic", data.rafi_pic);
      resp = await addRecord(type, fd);
    } else {
      resp = await addRecord(type, data);
    }
    if (!(resp && resp.error)) {
      setMessageBox({ ...messageBox, isOpen: true, message: "Record added successfully!" });
      setAddPinOpen(false);
      fetchAll();
    } else {
      setMessageBox({ ...messageBox, isOpen: true, message: resp.error });
    }
  };

  return (
    <div>
      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBox.onClose}
        type={messageBox.type}
        message={messageBox.message}
        onSubmit={messageBox.onSubmit}
      />
      <button className="add-pin-btn" onClick={() => setAddPinOpen(true)}>+ Add Pin</button>
      <AddPinModal isOpen={addPinOpen} onClose={() => setAddPinOpen(false)} handleAddPin={handleAddPin} />
      <div className="table-container">
        <h2>LGU List</h2>
        {lguResponse ? <TableView tableJSON={lguResponse} /> : <div>Loading LGU data...</div>}
      </div>
      <div className="table-container">
        <h2>Barangay List</h2>
        {barangayResponse ? <TableView tableJSON={barangayResponse} /> : <div>Loading Barangay data...</div>}
      </div>
      <div className="table-container">
        <h2>RAFI Infrastructure List</h2>
        {rafiResponse ? <TableView tableJSON={rafiResponse} /> : <div>Loading RAFI data...</div>}
      </div>
    </div>
  );
};

export default ManagePins;
