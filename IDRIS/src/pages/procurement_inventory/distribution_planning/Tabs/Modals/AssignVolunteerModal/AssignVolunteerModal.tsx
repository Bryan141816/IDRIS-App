interface AssignVolunteerModalProp {
  onClose: () => void;
}
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
export const AssignVolunteerModal: React.FC<AssignVolunteerModalProp> = ({
  onClose,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Assign Volunteer to Deployment Area</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label>Select Volunteer</label>
            <select>
              <option>Choose volunteer...</option>
              {volunteers
                .filter((v) => v.status === "Available")
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} - {v.role}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label>Deployment Area</label>
            <select>
              <option>Select area...</option>
              <option>Cebu City North</option>
              <option>Mandaue Central</option>
              <option>Lapu-Lapu East</option>
              <option>Talisay West</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assignment Duration</label>
            <input type="date" />
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn">Assign</button>
        </div>
      </div>
    </div>
  );
};
