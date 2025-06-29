import {
  TableView,
  TableReponse,
} from "../../../components/TableView/table_view";
import "./DemandAndResponseList.scss";
import { Modal } from "../../../components/Page_Furniture/Modals";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
  getReportList,
  addResponseReport,
  deleteResponseReport,
  updateResponseReport,
} from "../../../API_Handler/reponse_dashboard_report_list";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const DemandAndResponseList = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [reportType, setReportType] = useState("EOD Report");
  const [isViewModalSelected, setIsViewModalSelected] = useState<any>(null);
  const [isMoreOptionVisible, setMoreOptionVisible] = useState(false);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
  const [editReportType, setEditReportType] = useState("");
  const [editStatus, setEditStatus] = useState("");

  type NeedItem = {
    id: number;
    need: string;
    amount: string;
  };

  const [addDemand, setAddDemand] = useState<{
    title: string;
    address: string;
    needs: NeedItem[];
    priority: string;
  }>({
    title: "",
    address: "",
    needs: [],
    priority: "",
  });

  const [needInput, setNeedInput] = useState<{ need: string; amount: string }>({
    need: "",
    amount: "",
  });

  const [needItemCounter, setNeedItemCounter] = useState(0);

  const handleAddModalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAddDemand((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleNeedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNeedInput((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddNeeds = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (needInput.need == "" || needInput.amount == "") {
      return;
    }
    e.preventDefault();

    const newDemand: NeedItem = {
      id: needItemCounter,
      need: needInput.need,
      amount: needInput.amount,
    };

    setAddDemand((prev) => ({
      ...prev,
      needs: [...prev.needs, newDemand],
    }));
    setNeedItemCounter(needItemCounter + 1);
    setNeedInput({ need: "", amount: "" });
    console.log(addDemand);
  };
  const openViewModal = () => setIsViewModalOpen(true);
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setMoreOptionVisible(false);
  };

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => setAddModalOpen(false);

  const openEditModal = () => setIsEditModeEnabled(true);
  const closeEditModal = () => setIsEditModeEnabled(false);

  const toggleMoreOptionVisible = () =>
    setMoreOptionVisible(!isMoreOptionVisible);

  async function fetchData() {
    try {
      const response = await getReportList();
      setResposeData(response);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleReportTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setReportType(event.target.value);
  };
  const handleEditReportTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setEditReportType(event.target.value);
  };
  const handleEditStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setEditStatus(event.target.value);
  };

  const handleAddReportSubmit = async () => {
    try {
      const response = await addResponseReport(reportType);
      console.log("Report added: ", response);
      closeAddModal();
      await fetchData();
    } catch (error) {
      console.error("Failed to add report: ", error);
    }
  };

  const handleDeleteReport = async (report_id: String) => {
    try {
      const response = await deleteResponseReport(report_id);
      closeViewModal();
      await fetchData();
    } catch (error) {
      console.error("Failed to delete report: ", error);
    }
  };

  const handleEditReport = async () => {
    const response = await updateResponseReport(
      isViewModalSelected.data[0].text,
      editReportType,
      editStatus,
    );
    if (response.sucess) {
      closeEditModal();
      console.log(response.data);
      isViewModalSelected.data[2].text = response.data.report.report_type;
      isViewModalSelected.data[3].text = response.data.report.status;
      await fetchData();
      openViewModal();
    } else {
      console.error("Error updating report: " + response.error);
    }
  };

  return (
    <div className="report-container">
      <Modal isOpen={isEditModeEnabled} onClose={closeEditModal}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Edit Report</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Report Type:</span>
            <select
              value={editReportType}
              onChange={handleEditReportTypeChange}
            >
              <option value="EOD Report">EOD Report</option>
              <option value="Budget Report">Budget Report</option>
              <option value="Distribution Report">Distribution Report</option>
              <option value="Demand Assessment">Demand Assessment</option>
              <option value="Modality Report">Modality Report</option>
              <option value="In-Kind Monitoring">In-Kind Monitoring</option>
            </select>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Status:</span>
            <select value={editStatus} onChange={handleEditStatusChange}>
              <option value="Filed">Filed</option>
              <option value="Started">Started</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="action-button">
            <button
              onClick={handleEditReport}
              style={{ backgroundColor: "#749AB6" }}
            >
              Submit
            </button>
            <button
              style={{ backgroundColor: "#F84B4D" }}
              onClick={closeEditModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Create Demand Report</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Title:</span>
            <input
              type="text"
              name="title"
              value={addDemand.title}
              onChange={handleAddModalChange}
            />
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Address:</span>
            <input
              type="text"
              value={addDemand.address}
              onChange={handleAddModalChange}
              name="address"
            />
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "row",
                gap: "5px",
              }}
            >
              <input type="text" readOnly placeholder="Select a location"/>
              <button
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #ddd",
                  outline: "none",
                  color: "#3b82f6",
                  width: "35px",
                  borderRadius: "5px",
                }}
              >
                {" "}
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  style={{ height: "20px" }}
                />
              </button>
            </div>
          </div>

          <div className="horizontal-container">
            <span className="item-details-identifier">Needs:</span>
            <div className="dynamic-info-container">
              <form id="needs-adder">
                <input
                  type="text"
                  placeholder="Enter a need"
                  id="input-need"
                  value={needInput.need}
                  name="need"
                  onChange={handleNeedInputChange}
                  required
                />
                <input
                  type="number"
                  placeholder="Enter Amount"
                  id="input-amount"
                  value={needInput.amount}
                  name="amount"
                  onChange={handleNeedInputChange}
                  required
                />
                <button onClick={handleAddNeeds}>Add</button>
              </form>
              <div id="needs-content-container">
                {addDemand.needs.map((need) => (
                  <div key={need.id} className="needs-content">
                    <span id="need-label-adder">{need.need}</span>
                    <span>| {need.amount} |</span>
                    <button
                      onClick={() => {
                        setAddDemand((prev) => ({
                          ...prev,
                          needs: prev.needs.filter((n) => n.id !== need.id),
                        }));
                      }}
                      style={{
                        marginLeft: "10px",
                        color: "white",
                        backgroundColor: "red",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Priority:</span>
            <input
              type="text"
              value={addDemand.priority}
              onChange={handleAddModalChange}
              name="priority"
            />
          </div>

          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6" }}
              onClick={handleAddReportSubmit}
            >
              Add
            </button>
            <button
              style={{ backgroundColor: "#F84B4D" }}
              onClick={closeAddModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      {isViewModalSelected ? (
        <Modal isOpen={isViewModalOpen} onClose={closeViewModal}>
          <div className="modal-container">
            <div className="horizontal-container space-between-container">
              <span className="title-modal-text">View Report</span>
              <div
                className="horizontal-container"
                style={{ width: "auto", gap: "5px" }}
              >
                <button className="mark-as-button">Mark as Started</button>
                <div className="more-options-container">
                  <button onClick={toggleMoreOptionVisible}>
                    <FontAwesomeIcon
                      icon={faEllipsisVertical}
                      style={{ height: "20px" }}
                    />
                  </button>
                  {isMoreOptionVisible && (
                    <div className="more-options-viewer">
                      <button
                        onClick={() => {
                          closeViewModal();
                          setEditReportType(isViewModalSelected.data[2].text);
                          setEditStatus(isViewModalSelected.data[3].text);
                          openEditModal();
                        }}
                      >
                        <FontAwesomeIcon icon={faPen} />
                        Edit Record
                      </button>
                      <button
                        style={{ color: "red" }}
                        onClick={() => {
                          handleDeleteReport(isViewModalSelected.data[0].text);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} /> Delete Record
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="horizontal-container">
              <span className="details-title">Details</span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Report Type:</span>
              <span>{isViewModalSelected.data[2].text}</span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Status:</span>
              <span>{isViewModalSelected.data[3].text}</span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Date:</span>
              <span>{isViewModalSelected.data[1].text}</span>
            </div>
            <div className="action-button">
              <button
                style={{ backgroundColor: "#749AB6" }}
                onClick={closeViewModal}
              >
                Ok
              </button>
              <button
                style={{ backgroundColor: "#F84B4D" }}
                onClick={closeViewModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      ) : (
        <></>
      )}

      <div className="horizontal-container">
        <div className="navigator-container">
          <Link to="/response_dashboard/demand_and_response_map">
            Demand And Response Map
          </Link>
          <h3>/List View</h3>
        </div>
        <div className="table-actions">
          <input type="text" placeholder="Search report"></input>
          <button>Search</button>
          <button onClick={openAddModal}>+ Add Report</button>
        </div>
      </div>
      {response_data ? (
        <TableView
          tableJSON={response_data}
          onClickCallback={(row: any) => {
            setIsViewModalSelected(row);
            openViewModal();
          }}
          setCallbackTableData={true}
        />
      ) : (
        <div>Loading data...</div>
      )}
    </div>
  );
};
export default DemandAndResponseList;
