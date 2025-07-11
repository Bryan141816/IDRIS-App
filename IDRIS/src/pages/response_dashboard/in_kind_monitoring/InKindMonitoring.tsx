import {
  TableView,
  TableReponse,
} from "../../../components/TableView/table_view";
import "./InKindMonitoring.scss";
import { Modal } from "../../../components/Page_Furniture/Modals";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { updateResponseReport } from "../../../API_Handler/reponse_dashboard_report_list";

import {
  getInKindList,
  addRecord,
  deleteRecord,
  markAsDelivered,
} from "../../../API_Handler/response_dashboard_in_kind_monitoring";
import { fetchData as fetchApiData } from "../../../API_Handler/response_dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { MessageBox } from "../../../components/Page_Furniture/MessageBox.tsx";

type MessageBoxState = {
  isOpen: boolean;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
  onClose: () => void;
};

type InKindMonitoring = {
  available_relief_packs: number;
  currently_in_transit: number;
  already_distributed: number;
};

const InKindMonitoring = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [inKindSummary, setInKindSummary] = useState<InKindMonitoring | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [dispatch, setDispatch] = useState("");
  const [isViewModalSelected, setIsViewModalSelected] = useState<any>(null);
  const [isMoreOptionVisible, setMoreOptionVisible] = useState(false);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
  const [editReportType, setEditReportType] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const closeMessageBox = () => {
    setMessageBox((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const [messageBox, setMessageBox] = useState<MessageBoxState>({
    isOpen: false,
    type: "message",
    message: "",
    onSubmit: undefined,
    onClose: closeMessageBox,
  });

  const openViewModal = () => setIsViewModalOpen(true);
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setMoreOptionVisible(false);
  };

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => setAddModalOpen(false);

  const openDispatchModal = () => setIsDispatchOpen(true);
  const closeDispatchModal = () => setIsDispatchOpen(false);

  const openEditModal = () => setIsEditModeEnabled(true);
  const closeEditModal = () => setIsEditModeEnabled(false);

  const toggleMoreOptionVisible = () =>
    setMoreOptionVisible(!isMoreOptionVisible);

  async function fetchData() {
    try {
      const response = await getInKindList();
      setResposeData(response);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchData();
    fetchApiData<InKindMonitoring>(
      "/response_dashboard/in_kind_monitoring",
      setInKindSummary,
    );
  }, []);

  const handleQuanityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(event.target.value);
  };
  const handleDispatchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    const num = parseInt(val);
    const total = inKindSummary?.available_relief_packs ?? 0;
    if (val === "" || (!isNaN(num) && num >= 1 && num <= total)) {
      setDispatch(event.target.value);
    } else if (num >= total) {
      setDispatch(total.toString());
    }
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
      const response = await addRecord("Add", parseInt(quantity));
      setQuantity("");
      closeAddModal();
      fetchApiData<InKindMonitoring>(
        "/response_dashboard/in_kind_monitoring",
        setInKindSummary,
      );
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record added successfuly?",
        onClose: closeMessageBox,
      }));
      await fetchData();
    } catch (error) {
      console.error("Failed to add report: ", error);
    }
  };
  const handleDispatchSubmit = async () => {
    try {
      const response = await addRecord("In-Transit", parseInt(dispatch));
      setDispatch("");
      closeDispatchModal();
      fetchApiData<InKindMonitoring>(
        "/response_dashboard/in_kind_monitoring",
        setInKindSummary,
      );
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Relief packs dispatched?",
        onClose: closeMessageBox,
      }));

      await fetchData();
    } catch (error) {
      console.error("Failed to Dispatch: ", error);
    }
  };

  const handleDeleteReport = async (report_id: String) => {
    try {
      const response = await deleteRecord(report_id);
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record deleted successfuly?",
        onClose: closeMessageBox,
      }));
      closeViewModal();
      fetchApiData<InKindMonitoring>(
        "/response_dashboard/in_kind_monitoring",
        setInKindSummary,
      );

      await fetchData();
    } catch (error) {
      console.error("Failed to delete report: ", error);
    }
  };
  const handleMarkAsDelivered = async (record_id: String) => {
    try {
      await markAsDelivered(record_id);
      closeViewModal();
      fetchApiData<InKindMonitoring>(
        "/response_dashboard/in_kind_monitoring",
        setInKindSummary,
      );
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record ?",
        onClose: closeMessageBox,
      }));
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
      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBox.onClose}
        type={messageBox.type}
        message={messageBox.message}
        onSubmit={messageBox.onSubmit}
      ></MessageBox>

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
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev, // preserves onClose and anything else
                  isOpen: true, // your new values
                  type: "confirm",
                  message: "Are you sure you want to edit this report?",
                  onSubmit: handleEditReport,
                }));
              }}
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
      <Modal isOpen={isDispatchOpen} onClose={closeDispatchModal}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Dispatch Relief Packs</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Quantity:</span>
            <input
              type="number"
              value={dispatch}
              onChange={handleDispatchChange}
            />
          </div>
          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6" }}
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev, // preserves onClose and anything else
                  isOpen: true, // your new values
                  type: "confirm",
                  message: "Are you sure you want to dispatch?",
                  onSubmit: handleDispatchSubmit,
                }));
              }}
            >
              Add
            </button>
            <button
              style={{ backgroundColor: "#F84B4D" }}
              onClick={closeDispatchModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Add Relief Packs</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Quantity:</span>
            <input
              type="number"
              value={quantity}
              onChange={handleQuanityChange}
            />
          </div>
          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6" }}
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev, // preserves onClose and anything else
                  isOpen: true, // your new values
                  type: "confirm",
                  message: "Are you sure you want to add this record?",
                  onSubmit: handleAddReportSubmit,
                }));
              }}
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
                {isViewModalSelected.data[3].text === "In-Transit" && (
                  <button
                    className="mark-as-button"
                    onClick={() => {
                      setMessageBox((prev) => ({
                        ...prev, // preserves onClose and anything else
                        isOpen: true, // your new values
                        type: "confirm",
                        message:
                          "Are you sure you want to mark it as delievered?",
                        onSubmit: () =>
                          handleMarkAsDelivered(
                            isViewModalSelected.data[0].text,
                          ),
                      }));
                    }}
                  >
                    Mark as Delivered
                  </button>
                )}
                <div className="more-options-container">
                  <button onClick={toggleMoreOptionVisible}>
                    <FontAwesomeIcon
                      icon={faEllipsisVertical}
                      style={{ height: "20px" }}
                    />
                  </button>
                  {isMoreOptionVisible && (
                    <div className="more-options-viewer">
                      {/*<button
                        onClick={() => {
                          closeViewModal();
                          setEditReportType(isViewModalSelected.data[2].text);
                          setEditStatus(isViewModalSelected.data[3].text);
                          openEditModal();
                        }}
                      >
                        <FontAwesomeIcon icon={faPen} />
                        Edit Record
                      </button>*/}
                      <button
                        style={{ color: "red" }}
                        onClick={() => {
                          setMessageBox((prev) => ({
                            ...prev, // preserves onClose and anything else
                            isOpen: true, // your new values
                            type: "confirm",
                            message:
                              "Are you sure you want to delete this record?",
                            onSubmit: () =>
                              handleDeleteReport(
                                isViewModalSelected.data[0].text,
                              ),
                          }));
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
              <span className="item-details-identifier">Quantity:</span>
              <span>{isViewModalSelected.data[2].text}</span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Type:</span>
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
          <Link to="/response_dashboard">Response Dashboard</Link>
          <h3>/In Kind Monitoring</h3>
        </div>
        <div className="table-actions">
          <input type="text" placeholder="Search report"></input>
          <button>Search</button>
          <button onClick={openAddModal}>+ Add Relief Packs</button>
          <button onClick={openDispatchModal}>
            {" "}
            <FontAwesomeIcon icon={faTruck} style={{ height: "14px" }} />
            &nbsp; Dispatch Relief Packs
          </button>
        </div>
      </div>
      <div id="inKindSummary">
        <div>
          {inKindSummary ? (
            <span>{inKindSummary.available_relief_packs}</span>
          ) : (
            <span>Loading Data</span>
          )}
          <h2>Available Relief Packs</h2>
        </div>
        <div>
          {inKindSummary ? (
            <span>{inKindSummary.currently_in_transit}</span>
          ) : (
            <span>Loading Data</span>
          )}
          <h2>In-Transit Relief Packs</h2>
        </div>
        <div>
          {inKindSummary ? (
            <span>{inKindSummary.already_distributed}</span>
          ) : (
            <span>Loading Data</span>
          )}
          <h2>Delivered Relief Packs</h2>
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
export default InKindMonitoring;
