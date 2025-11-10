import "../ProcurementInventory.scss";
import "../ProcurementModal.scss";
import RequestTab from "../procurement_management/Tabs/Request";
const ProcurementManagement = () => {
  return (
    <div className="procurement-management">
      <h3 className="public-feed-title">PROCUREMENT MANAGEMENT</h3>

      <div className="mains-content">
        <RequestTab apiUrl="/request_procurement" />
      </div>
    </div>
  );
};

export default ProcurementManagement;
