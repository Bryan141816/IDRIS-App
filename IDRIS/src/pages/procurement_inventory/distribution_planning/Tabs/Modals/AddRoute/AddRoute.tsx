interface AddRouteModalProp {
  onClose: () => void;
}

export const AddRouteModal: React.FC<AddRouteModalProp> = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Create New Route</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label>Route Name</label>
            <input type="text" placeholder="Enter route name" />
          </div>
          <div className="form-group">
            <label>Start Location</label>
            <input type="text" placeholder="Starting point" />
          </div>
          <div className="form-group">
            <label>End Location</label>
            <input type="text" placeholder="Destination" />
          </div>
          <div className="form-group">
            <label>Schedule</label>
            <input type="datetime-local" />
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn">Create Route</button>
        </div>
      </div>
    </div>
  );
};
