import Swal from "sweetalert2";
import { TableView, TableReponse } from "../../components/TableView/table_view";
import { Modal } from "../../components/Page_Furniture/Modals";
import React, { useEffect, useState, useRef } from "react";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
  faUserPlus,
  faSearch,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useUserRoleContext } from "../../UserRoleContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MessageBox } from "../../components/Page_Furniture/MessageBox";
import { API } from "../../API_Handler/Axio_API_Handler";
import "./ManageUsers.scss";

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

async function approveUser(user_id: String): Promise<any> {
  try {
    const response = await API.post(`/approve_admin/${user_id}`);
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
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response) {
      console.error("Error: ", error.response.data.detail);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    } else {
      console.error("Request error: ", error.message);
      return { success: false, error: "An unexpected error occurred." };
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
  handleApproveAdmin: (user_id: string) => void;
  openEditModal: () => void;
  isViewModalSelected: any;
};

const ViewReportModal = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleDeleteReport,
  handleApproveAdmin,
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
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className="modal-container">
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">View User</span>
          <div
            className="horizontal-container"
            style={{ width: "auto", gap: "5px" }}
          >
            <div className="more-options-container">
              <button
                className="modal-more-btn"
                onClick={toggleMoreOptionVisible}
              >
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
                    className="delete-option"
                    onClick={() => {
                      setMessageBox((prev) => ({
                        ...prev,
                        isOpen: true,
                        type: "confirm",
                        message: "Are you sure you want to delete this user?",
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
          <span className="role-badge">
            {toTitleCase(isViewModalSelected.data[5].text)}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Is Activated:</span>
          <span>{toTitleCase(isViewModalSelected.data[6].text)}</span>
        </div>
        <div className="action-button">
          {isViewModalSelected.data[4].text === "admin" &&
            isViewModalSelected.data[6].text === "False" && (
              <button
                className="submit-btn"
                onClick={() => {
                  setMessageBox((prev) => ({
                    ...prev,
                    isOpen: true,
                    type: "confirm",
                    message: "Are you sure you want to approve this admin?",
                    onSubmit: () =>
                      handleApproveAdmin(isViewModalSelected.data[0].text),
                  }));
                }}
              >
                Approve
              </button>
            )}
          <button className="close-btn" onClick={closeModal}>
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
          <span className="details-title">Edit User</span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Role:</span>
          <select value={editRole} onChange={handleEditReportTypeChange}>
            <option value="lgu officer">LGU Officer</option>
            <option value="operations admin">Operations Admin</option>
            <option value="logistics admin">Logistics Admin</option>
            <option value="finance admin">Finance Admin</option>
            <option value="generic">Generic User</option>
          </select>
        </div>
        <div className="action-button">
          <button
            className="submit-btn"
            onClick={() => {
              setMessageBox((prev) => ({
                ...prev,
                isOpen: true,
                type: "confirm",
                message: "Are you sure you want to edit this user?",
                onSubmit: () => handleEditReport(editRole),
              }));
            }}
          >
            Submit
          </button>
          <button className="cancel-btn" onClick={closeModal}>
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
  const [search, setSearch] = useState("");

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
  const closeViewModal = () => setIsViewModalOpen(false);
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
        ...prev,
        isOpen: true,
        type: "message",
        message: "User successfully deleted.",
        onClose: closeMessageBox,
      }));
      handleRefreshTable();
    } catch (error) {
      console.error("Failed to delete user: ", error);
    }
  };

  const handleEditReport = async (role: string) => {
    const response = await updateUser(isViewModalSelected.data[0].text, role);
    if (response.success) {
      closeEditModal();
      isViewModalSelected.data[4].text = response.data.user?.user_type;
      isViewModalSelected.data[5].text = response.data.user?.roles.join(", ");
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: "User successfully updated.",
        onClose: closeMessageBox,
      }));
      handleRefreshTable();
      openViewModal();
    } else {
      console.error("Error updating user: " + response.error);
    }
  };

  const handleApproveAdmin = async (user_id: String) => {
    Swal.fire({
      title: "Approving Admin",
      text: "Please wait...",
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    try {
      await approveUser(user_id);
      closeViewModal();
      Swal.fire({
        icon: "success",
        title: "Admin Approved",
        text: "Activation email sent successfully.",
      });
      handleRefreshTable();
    } catch (error) {
      console.error("Failed to approve admin: ", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to approve admin.",
      });
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  return (
    <div className="user-mgmt-root">
      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBox.onClose}
        type={messageBox.type}
        message={messageBox.message}
        onSubmit={messageBox.onSubmit}
      />

      {isViewModalSelected && (
        <ViewReportModal
          isModalOpen={isViewModalOpen}
          closeModal={closeViewModal}
          setMessageBox={setMessageBox}
          isViewModalSelected={isViewModalSelected}
          handleDeleteReport={handleDeleteReport}
          handleApproveAdmin={handleApproveAdmin}
          openEditModal={openEditModal}
        />
      )}

      {isViewModalSelected && (
        <EditReportModal
          isModalOpen={isEditModeEnabled}
          closeModal={closeEditModal}
          setMessageBox={setMessageBox}
          handleEditReport={handleEditReport}
          defaultRole={isViewModalSelected.data[5].text}
        />
      )}

      <div className="user-mgmt-header">
        <h2 className="section-title">Manage Users</h2>
        <button className="primary-btn">
          <FontAwesomeIcon icon={faUserPlus} />
          Add User
        </button>
      </div>

      <div className="user-mgmt-actions">
        <div className="user-mgmt-searchbar">
          <input
            type="text"
            placeholder="Search user by name, email, or role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="styled-input"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="icon-btn" onClick={handleSearch}>
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
      </div>

      <div className="user-table-card">
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
          <div className="loading-msg">
            <div className="loading-spinner"></div>
            Loading users...
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
