import {
  TableView,
  TableReponse,
} from "../../../components/TableView/table_view";
import "../DefaultListViewStyle.scss";
import { Modal } from "../../../components/Page_Furniture/Modals";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import {
  getModalityList,
  addModalityRecord,
  updateModalityRecord,
  deleteModalityRecord,
} from "../../../API_Handler/response_dashboard_modality_distribution";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { MessageBox } from "../../../components/Page_Furniture/MessageBox.tsx";

type MessageBoxState = {
  isOpen: boolean;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
  onClose: () => void;
};

const ModalityDistribution = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [modalityType, setModalityType] = useState("Cash");
  const [isViewModalSelected, setIsViewModalSelected] = useState<any>(null);
  const [isMoreOptionVisible, setMoreOptionVisible] = useState(false);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
  const [editModalityType, setEditModalityType] = useState("");
  const refreshTable = useRef<() => void>(() => {});

  const handleRefreshTable = () => refreshTable.current?.();

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

  const openEditModal = () => setIsEditModeEnabled(true);
  const closeEditModal = () => setIsEditModeEnabled(false);

  const toggleMoreOptionVisible = () =>
    setMoreOptionVisible(!isMoreOptionVisible);

  async function fetchData() {
    try {
      const response = await getModalityList();
      setResposeData(response);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleModalityTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setModalityType(event.target.value);
  };
  const handleEditModalityTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setEditModalityType(event.target.value);
  };

  const handleAddModalitySubmit = async () => {
    try {
      const response = await addModalityRecord(modalityType);
      closeAddModal();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record is added successfuly",
        onClose: closeMessageBox,
      }));
      handleRefreshTable();
    } catch (error) {
      console.error("Failed to add report: ", error);
    }
  };

  const handleDeleteRecord = async (record_id: String) => {
    try {
      const response = await deleteModalityRecord(record_id);
      closeViewModal();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record is deleted successfuly",
        onClose: closeMessageBox,
      }));
      handleRefreshTable();
    } catch (error) {
      console.error("Failed to delete report: ", error);
    }
  };

  const handleEditRecord = async () => {
    const response = await updateModalityRecord(
      isViewModalSelected.data[0].text,
      editModalityType,
    );
    if (response.sucess) {
      closeEditModal();
      isViewModalSelected.data[2].text = response.data.report.modality_type;
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record is updated successfuly",
        onClose: closeMessageBox,
      }));
      handleRefreshTable();
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
            <span className="details-title">Edit LIst</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Modality Type:</span>
            <select
              value={editModalityType}
              onChange={handleEditModalityTypeChange}
            >
              <option value="Cash">Cash</option>
              <option value="InKind">InKind</option>
              <option value="Services">Services</option>
            </select>
          </div>
          <div className="action-button">
            <button
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev, // preserves onClose and anything else
                  isOpen: true, // your new values
                  type: "confirm",
                  message: "Are you sure you want to edit this record?",
                  onSubmit: handleEditRecord,
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
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Create LIst</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Modality Type:</span>
            <select value={modalityType} onChange={handleModalityTypeChange}>
              <option value="Cash">Cash</option>
              <option value="InKind">InKind</option>
              <option value="Services">Services</option>
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
                  message: "Are you sure you want to add this record?",
                  onSubmit: handleAddModalitySubmit,
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
              <span className="title-modal-text">View Record</span>
              <div
                className="horizontal-container"
                style={{ width: "auto", gap: "5px" }}
              >
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
                          setEditModalityType(isViewModalSelected.data[2].text);
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
                            message:
                              "Are you sure you want to delete this record?",
                            onSubmit: () =>
                              handleDeleteRecord(
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
              <span className="item-details-identifier">Modality Type:</span>
              <span>{isViewModalSelected.data[2].text}</span>
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
          <h3>/Modality Distribution</h3>
        </div>
        <div className="table-actions">
          <input type="text" placeholder="Search report"></input>
          <button>Search</button>
          <button onClick={openAddModal}>+ Add Record</button>
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
          pageRequest="/response_dashboard/modality_distribution/record_list?page="
          updateTable={(fn) => (refreshTable.current = fn)}
        />
      ) : (
        <div>Loading data...</div>
      )}
    </div>
  );
};
export default ModalityDistribution;
