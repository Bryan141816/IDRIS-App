import {
  TableView,
  TableReponse,
} from "../../../components/TableView/table_view";
import "./ModalityDistribution.scss";
import { Modal } from "../../../components/Page_Furniture/Modals";
import { useEffect, useState } from "react";
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

const ModalityDistribution = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [modalityType, setModalityType] = useState("Cash");
  const [isViewModalSelected, setIsViewModalSelected] = useState<any>(null);
  const [isMoreOptionVisible, setMoreOptionVisible] = useState(false);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
  const [editModalityType, setEditModalityType] = useState("");

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
      console.log(response);
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
      console.log("LIst added: ", response);
      closeAddModal();
      await fetchData();
    } catch (error) {
      console.error("Failed to add report: ", error);
    }
  };

  const handleDeleteRecord = async (record_id: String) => {
    try {
      const response = await deleteModalityRecord(record_id);
      closeViewModal();
      await fetchData();
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
      console.log(response.data);
      isViewModalSelected.data[2].text = response.data.report.modality_type;
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
              onClick={handleEditRecord}
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
              onClick={handleAddModalitySubmit}
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
                          handleDeleteRecord(isViewModalSelected.data[0].text);
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
        />
      ) : (
        <div>Loading data...</div>
      )}
    </div>
  );
};
export default ModalityDistribution;
