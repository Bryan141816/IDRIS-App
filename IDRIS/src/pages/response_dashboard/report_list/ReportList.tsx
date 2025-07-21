import {
  TableView,
  TableReponse,
} from "../../../components/TableView/table_view";
import "./ReportList.scss";
import { Modal } from "../../../components/Page_Furniture/Modals";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import {
  getReportList,
  addResponseReport,
  deleteResponseReport,
  updateResponseReport,
} from "../../../API_Handler/reponse_dashboard_report_list";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MessageBox } from "../../../components/Page_Furniture/MessageBox.tsx";

type MessageBoxState = {
  isOpen: boolean;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
  onClose: () => void;
};

type BaseModalProps = {
  isModalOpen: boolean;
  closeModal: () => void;
  setMessageBox: React.Dispatch<React.SetStateAction<MessageBoxState>>;
};
type AddReportListProps = BaseModalProps & {
  handleAddReportSubmit: (reportType: string) => void;
};
type EditReportModalProps = BaseModalProps & {
  handleEditReport: (editReportType: string, editStatus: string) => void;
  defaultReportType: string;
  defaultStatus: string;
};
type ViewReportModalProps = BaseModalProps & {
  handleDeleteReport: (report_id: string) => void;
  openEditModal: () => void;
  isViewModalSelected: any;
};

const ViewReportModal = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleDeleteReport,
  openEditModal,
  isViewModalSelected,
}: ViewReportModalProps) => {
  const [isMoreOptionVisible, setMoreOptionVisible] = useState(false);
  useEffect(() => {
    if (!isModalOpen) {
      setMoreOptionVisible(false);
    }
  }, [isModalOpen]);
  const toggleMoreOptionVisible = () =>
    setMoreOptionVisible(!isMoreOptionVisible);

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
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
                      closeModal();
                      openEditModal();
                    }}
                  >
                    <FontAwesomeIcon icon={faPen} />
                    Edit Record
                  </button>
                  <button
                    style={{ color: "red" }}
                    onClick={() => {
                      setMessageBox((prev) => ({
                        ...prev, // preserves onClose and anything else
                        isOpen: true, // your new values
                        type: "confirm",
                        message: "Are you sure you want to delete this report?",
                        onSubmit: () =>
                          handleDeleteReport(isViewModalSelected.data[0].text),
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
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
const EditReportModal = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditReport,
  defaultReportType,
  defaultStatus,
}: EditReportModalProps) => {
  const [editReportType, setEditReportType] = useState(defaultReportType);
  const [editStatus, setEditStatus] = useState(defaultStatus);
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
  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className="modal-container">
        <div className="horizontal-container">
          <span className="details-title">Edit Report</span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Report Type:</span>
          <select value={editReportType} onChange={handleEditReportTypeChange}>
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
                onSubmit: () => handleEditReport(editReportType, editStatus),
              }));
            }}
            style={{ backgroundColor: "#749AB6" }}
          >
            Submit
          </button>
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

const AddReportList = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddReportSubmit,
}: AddReportListProps) => {
  const [reportType, setReportType] = useState("EOD Report");
  const handleReportTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setReportType(event.target.value);
  };
  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className="modal-container">
        <div className="horizontal-container">
          <span className="details-title">Create Report</span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Report Type:</span>
          <select value={reportType} onChange={handleReportTypeChange}>
            <option value="EOD Report">EOD Report</option>
            <option value="Budget Report">Budget Report</option>
            <option value="Distribution Report">Distribution Report</option>
            <option value="Demand Assessment">Demand Assessment</option>
            <option value="Modality Report">Modality Report</option>
            <option value="In-Kind Monitoring">In-Kind Monitoring</option>
          </select>
        </div>
        <div className="action-button">
          <button
            style={{ backgroundColor: "#749AB6" }}
            onClick={() => {
              setMessageBox((prev) => ({
                ...prev, // preserves onClose and anything else
                isOpen: true, // your new values
                type: "confirm",
                message: "Are you sure you want to add this report?",
                onSubmit: () => handleAddReportSubmit(reportType),
              }));
            }}
          >
            Add
          </button>
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
const ReportList = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isViewModalSelected, setIsViewModalSelected] = useState<any>(null);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);

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
  };

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => setAddModalOpen(false);

  const openEditModal = () => setIsEditModeEnabled(true);
  const closeEditModal = () => setIsEditModeEnabled(false);

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

  const handleAddReportSubmit = async (reportType: string) => {
    try {
      await addResponseReport(reportType);
      closeAddModal();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Report is successfuly added?",
        onClose: closeMessageBox,
      }));

      await fetchData();
    } catch (error) {
      console.error("Failed to add report: ", error);
    }
  };

  const handleDeleteReport = async (report_id: String) => {
    try {
      await deleteResponseReport(report_id);
      closeViewModal();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Report is successfuly deleted?",
        onClose: closeMessageBox,
      }));

      await fetchData();
    } catch (error) {
      console.error("Failed to delete report: ", error);
    }
  };

  const handleEditReport = async (
    editReportType: string,
    editStatus: string,
  ) => {
    const response = await updateResponseReport(
      isViewModalSelected.data[0].text,
      editReportType,
      editStatus,
    );
    if (response.sucess) {
      closeEditModal();
      isViewModalSelected.data[2].text = response.data.report.report_type;
      isViewModalSelected.data[3].text = response.data.report.status;
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Report is successfuly updated?",
        onClose: closeMessageBox,
      }));

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

      {isViewModalSelected && (
        <EditReportModal
          isModalOpen={isEditModeEnabled}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          handleEditReport={handleEditReport}
          defaultReportType={isViewModalSelected.data[2].text}
          defaultStatus={isViewModalSelected.data[3].text}
        ></EditReportModal>
      )}

      <AddReportList
        isModalOpen={isAddModalOpen}
        closeModal={closeAddModal}
        handleAddReportSubmit={handleAddReportSubmit}
        setMessageBox={setMessageBox}
      />
      {isViewModalSelected && (
        <ViewReportModal
          isModalOpen={isViewModalOpen}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          isViewModalSelected={isViewModalSelected}
          handleDeleteReport={handleDeleteReport}
          openEditModal={openEditModal}
        ></ViewReportModal>
      )}

      <div className="horizontal-container">
        <div className="navigator-container">
          <Link to="/response_dashboard">Response Dashboard</Link>
          <h3>/Report List</h3>
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
export default ReportList;
