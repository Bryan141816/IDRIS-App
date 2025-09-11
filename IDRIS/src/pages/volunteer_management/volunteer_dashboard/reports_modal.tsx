import "./css/reportsModal.css";
import { useNavigate } from "react-router-dom";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const ReportModal = ({ isOpen, onClose }: ModalProps) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Add Program</h3>
                    <button onClick={onClose} className="close-btn">
                        ×
                    </button>
                </div>
                <div className="modal-action">
                    <button
                        type="button"
                        onClick={() => navigate("/volunteer_management/VolunteerReports")}
                        className="cancel-btn"
                    >
                        Volunteer reports
                    </button>
                    <button
                        type="submit"
                        className="save-btn"
                        onClick={() => navigate("/volunteer_management/ProgramsReports")}
                    >
                      Programs reports
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
