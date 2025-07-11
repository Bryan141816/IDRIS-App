import {
  TableView,
  TableReponse,
} from "../../../components/TableView/table_view";
import "./BudgetRecord.scss";
import { Modal } from "../../../components/Page_Furniture/Modals";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import {
  getBudgetRecordList,
  addBudgetRecord,
  deleteBudgetRecord,
  updateBudgetRecord,
} from "../../../API_Handler/response_dashboard_budget_record";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { MessageBox } from "../../../components/Page_Furniture/MessageBox.tsx";

type MessageBoxState = {
  isOpen: boolean;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
  onClose: () => void;
};

// TODO
// Fix the way it caculate the total budget.

const BudgetRecord = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [recordType, setRecordType] = useState("Add");
  const [amount, setAmount] = useState("");
  const [isViewModalSelected, setIsViewModalSelected] = useState<any>(null);
  const [isMoreOptionVisible, setMoreOptionVisible] = useState(false);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
  const [editRecordType, setEditRecordType] = useState("");
  const [editAmount, setEditAmount] = useState("");

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
      const response = await getBudgetRecordList();
      setResposeData(response);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setRecordType(event.target.value);
    setAmount("");
  };
  const handleAmountTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = event.target.value;
    const num = parseFloat(val);
    const balance = parseFloat(
      response_data?.table_datas?.[0]?.data?.[4]?.text ?? "0",
    );
    if (recordType === "Add") {
      setAmount(event.target.value);
    } else {
      if (val === "" || (!isNaN(num) && num >= 1 && num <= balance)) {
        setAmount(event.target.value);
      } else if (num >= balance) {
        setAmount(balance.toString());
      }
    }
  };
  const handleEditRecordTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setEditRecordType(event.target.value);
  };
  const handleEditAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setEditAmount(event.target.value);
  };

  const handleAddModalitySubmit = async () => {
    try {
      const response = await addBudgetRecord(recordType, amount);
      setAmount("");
      closeAddModal();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record is added successfuly",
        onClose: closeMessageBox,
      }));

      await fetchData();
    } catch (error) {
      console.error("Failed to add report: ", error);
    }
  };

  const handleDeleteRecord = async (record_id: String) => {
    try {
      const response = await deleteBudgetRecord(record_id);
      closeViewModal();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record is deleted successfuly",
        onClose: closeMessageBox,
      }));

      await fetchData();
    } catch (error) {
      console.error("Failed to delete report: ", error);
    }
  };

  const handleEditRecord = async () => {
    const response = await updateBudgetRecord(
      isViewModalSelected.data[0].text,
      editRecordType,
      editAmount,
    );
    if (response.sucess) {
      closeEditModal();
      isViewModalSelected.data[2].text =
        response.data.record.budget_record_type;
      isViewModalSelected.data[3].text = response.data.record.amount;
      isViewModalSelected.data[3].text = response.data.record.total_amount;
      await fetchData();
      openViewModal();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Record is updated successfuly",
        onClose: closeMessageBox,
      }));
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
            <span className="details-title">Edit Record</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Budget Record Type:</span>
            <select
              value={editRecordType}
              onChange={handleEditRecordTypeChange}
            >
              <option value="Add">Add</option>
              <option value="Food Supplies">Food Supplies</option>
              <option value="Medical Aid">Medical Aid</option>
              <option value="Logistics">Logistics</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Amount: </span>
            <input
              type="number"
              required
              value={editAmount}
              onChange={handleEditAmountChange}
            />
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
            <span className="details-title">Create Record</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Budget Record Type:</span>
            <select value={recordType} onChange={handleRecordTypeChange}>
              <option value="Add">Add</option>
              <option
                disabled={!response_data?.table_datas?.[0]?.data}
                value="Food Supplies"
              >
                Food Supplies
              </option>
              <option
                disabled={!response_data?.table_datas?.[0]?.data}
                value="Medical Aid"
              >
                Medical Aid
              </option>
              <option
                disabled={!response_data?.table_datas?.[0]?.data}
                value="Logistics"
              >
                Logistics
              </option>
              <option
                disabled={!response_data?.table_datas?.[0]?.data}
                value="Miscellaneous"
              >
                Miscellaneous
              </option>
            </select>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">
              Amount: (Current:{" "}
              {response_data?.table_datas?.[0]?.data?.[4]?.text ?? 0})
            </span>
            <input
              type="number"
              required
              value={amount}
              onChange={handleAmountTypeChange}
            />
          </div>{" "}
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
                          setEditRecordType(isViewModalSelected.data[2].text);
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
              <span className="item-details-identifier">
                Budget Record Type:
              </span>
              <span>{isViewModalSelected.data[2].text}</span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Amount:</span>
              <span>{isViewModalSelected.data[3].text}</span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Total Amount:</span>
              <span>{isViewModalSelected.data[4].text}</span>
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
          <h3>/Budget Record</h3>
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
export default BudgetRecord;
