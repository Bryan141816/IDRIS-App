import { useState } from "react";
import { AssignVolunteerModal } from "./Modals/AssignVolunteerModal/AssignVolunteerModal";
const volunteers = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    role: "Team Leader",
    status: "Available",
    area: "Cebu City",
  },
  {
    id: 2,
    name: "Maria Santos",
    role: "Volunteer",
    status: "Deployed",
    area: "Mandaue",
  },
  {
    id: 3,
    name: "Pedro Garcia",
    role: "Driver",
    status: "Available",
    area: "Lapu-Lapu",
  },
  {
    id: 4,
    name: "Ana Reyes",
    role: "Coordinator",
    status: "Available",
    area: "Talisay",
  },
];
export const VolunteerAssignmentTab = () => {
  const [activeModal, setActiveModal] = useState("");

  const openModal = (type: string, selectedData: any = null) => {
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal("");
  };
  return (
    <>
      {activeModal === "assign" && (
        <AssignVolunteerModal onClose={closeModal}></AssignVolunteerModal>
      )}
      <div className="assignment-content">
        <div className="section-header">
          <h2>Volunteer Assignment</h2>
          <button className="primary-btn" onClick={() => openModal("assign")}>
            + Assign Volunteer
          </button>
        </div>

        <div className="volunteers-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Area</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((volunteer) => (
                <tr key={volunteer.id}>
                  <td>{volunteer.name}</td>
                  <td>{volunteer.role}</td>
                  <td>
                    <span
                      className={`status-badge ${volunteer.status.toLowerCase()}`}
                    >
                      {volunteer.status}
                    </span>
                  </td>
                  <td>{volunteer.area}</td>
                  <td>
                    <button className="action-btn">Reassign</button>
                    <button className="action-btn">Contact</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
