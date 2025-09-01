import { TableView, TableReponse } from "../../components/TableView/table_view";
import { Modal } from "../../components/Page_Furniture/Modals";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { useUserRoleContext } from "../../UserRoleContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MessageBox } from "../../components/Page_Furniture/MessageBox";

import { API } from "../../API_Handler/Axio_API_Handler";
import "../response_dashboard/DefaultListViewStyle.scss";

async function getUserList(): Promise<any> {
  const response = await API.get("/user_list");
  return response.data;
}

async function deleteUser(user_id: String): Promise<any> {
  try {
    const response = await API.delete(`/delete_user/${user_id}`);
    return response;
  } catch (error: any) {
    if (error.response) {
      console.error("Error: ", error.response.data.detail);
    } else {
      console.error("Request error: ", error.message);
    }
  }
}

async function updateUser(user_id: String, role: String) {
  try {
    const response = await API.put(`/update_user/${user_id}`, {
      roles: role,
    });
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

type EditReportModalProps = BaseModalProps & {
  handleEditReport: (role: string) => void;
  defaultRole: string;
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
  function toTitleCase(str: String) {
    return str
      .toLowerCase() // make everything lowercase first
      .split(" ") // split into words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "); // join back into a sentence
  }

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className="modal-container">
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">View Report</span>
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
          <span className="item-details-identifier">Email Address:</span>
          <span>{isViewModalSelected.data[2].text}</span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">User Name:</span>
          <span>{isViewModalSelected.data[3].text}</span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">User Type:</span>
          <span>{toTitleCase(isViewModalSelected.data[4].text)}</span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Role:</span>
          <span>{toTitleCase(isViewModalSelected.data[5].text)}</span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Is Activated:</span>
          <span>{toTitleCase(isViewModalSelected.data[6].text)}</span>
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
  defaultRole,
}: EditReportModalProps) => {
  const [editRole, setEditRole] = useState(defaultRole);
  const { userRoles } = useUserRoleContext();

  const handleEditReportTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setEditRole(event.target.value);
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className="modal-container">
        <div className="horizontal-container">
          <span className="details-title">Edit Report</span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Role:</span>
          <select value={editRole} onChange={handleEditReportTypeChange}>
            {userRoles.includes("super admin") ||
              (userRoles.includes("operations admin") && (
                <option value="lgu officer">LGU Officer (Moderator)</option>
              ))}
            {userRoles.includes("super admin") ||
              (userRoles.includes("logistics admin") && (
                <option value="disaster response admin officer">
                  Disaster Response Admin Officer (Moderator)
                </option>
              ))}
            {userRoles.includes("super admin") ||
              (userRoles.includes("operations admin") && (
                <option value="operations admin">Operations Admin</option>
              ))}
            {userRoles.includes("super admin") ||
              (userRoles.includes("logistics admin") && (
                <option value="logistics admin">Logistics Admin</option>
              ))}
            {userRoles.includes("super admin") ||
              (userRoles.includes("finance admin") && (
                <option value="finance admin">Finance Admin</option>
              ))}
            <option value="generic">Generic User</option>
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
                onSubmit: () => handleEditReport(editRole),
              }));
            }}
            style={{ backgroundColor: "rgba(0, 102, 255, 0.5)" }}
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

const UserList = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isViewModalSelected, setIsViewModalSelected] = useState<any>(null);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);

  const refreshTable = useRef<() => void>(() => {});

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

  const openEditModal = () => setIsEditModeEnabled(true);
  const closeEditModal = () => setIsEditModeEnabled(false);

  async function fetchData() {
    try {
      const response = await getUserList();
      setResposeData(response);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);
  const handleRefreshTable = () => refreshTable.current?.();

  const handleDeleteReport = async (report_id: String) => {
    try {
      await deleteUser(report_id);
      closeViewModal();
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Report is successfuly deleted?",
        onClose: closeMessageBox,
      }));
      handleRefreshTable();
    } catch (error) {
      console.error("Failed to delete report: ", error);
    }
  };

  const handleEditReport = async (role: string) => {
    const response = await updateUser(isViewModalSelected.data[0].text, role);
    if (response.sucess) {
      closeEditModal();
      isViewModalSelected.data[4].text = response.data.user?.user_type;
      isViewModalSelected.data[5].text = response.data.user?.roles.join(", ");
      setMessageBox((prev) => ({
        ...prev, // preserves onClose and anything else
        isOpen: true, // your new values
        type: "message",
        message: "Report is successfuly updated?",
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
      {isViewModalSelected && (
        <EditReportModal
          isModalOpen={isEditModeEnabled}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          handleEditReport={handleEditReport}
          defaultRole={isViewModalSelected.data[5].text}
        ></EditReportModal>
      )}

      <div className="horizontal-container">
        <div className="navigator-container">
          <Link to="/response_dashboard">Response Dashboard</Link>
          <h3>/Report List</h3>
        </div>
        <div className="table-actions">
          <input type="text" placeholder="Search report"></input>
          <button>Search</button>
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
          pageRequest="/user_list?page="
          updateTable={(fn) => (refreshTable.current = fn)}
        />
      ) : (
        <div>Loading data...</div>
      )}
    </div>
  );
};
export default UserList;
