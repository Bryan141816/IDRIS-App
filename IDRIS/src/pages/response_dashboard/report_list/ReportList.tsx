import {
  TableView,
  TableReponse,
} from "../../../components/TableView/table_view";
import "./ReportList.scss";
import { Modal } from "../../../components/Page_Furniture/Modals";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getReportList,
  addResponseReport,
} from "../../../API_Handler/reponse_dashboard_report_list";

const ReportList = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [isViewModalSelected, setIsViewModalSelected] = useState<any>(null);

  const openViewModal = () => setIsViewModalOpen(true);
  const closeViewModal = () => setIsViewModalOpen(false);

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => setAddModalOpen(false);

  async function fetchData() {
    try {
      const response = await getReportList();
      setResposeData(response);
      console.log(response_data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleReportTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setReportType(event.target.value);
  };

  const handleAddReportSubmit = async () => {
    try {
      const response = await addResponseReport(reportType);
      console.log("Report added: ", response);
      closeAddModal();
      await fetchData();
    } catch (error) {
      console.error("Failed to add report: ", error);
    }
  };

  return (
    <div className="report-container">
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Create Report</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Report Type:</span>
            <select value={reportType} onChange={handleReportTypeChange}>
              <option value="EDO Report">EOD Report</option>
              <option value="Budget Report">Budget Report</option>
              <option value="Distribution Report">Distribution Report</option>
              <option value="Demand Assessment">Demand Assessment</option>
              <option value="Modality Report">Modality Report</option>
              <option value="In-Kind Monitoring">In-Kind Monitoring</option>
            </select>
          </div>
          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6" }}
              onClick={handleAddReportSubmit}
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
            <div className="horizontal-container">
              <span className="details-title">Details</span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Report Type:</span>
              <span>{isViewModalSelected.data[1].text}</span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Status:</span>
              <span>{isViewModalSelected.data[2].text}</span>
            </div>
            <div className="horizontal-container">
              <span className="item-details-identifier">Date:</span>
              <span>{isViewModalSelected.data[0].text}</span>
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
        <div>No data</div>
      )}

      <div className="horizontal-container">
        <div className="navigator-container">
          <Link to="/response_dashboard">Response Dashboard</Link>
          <h3>/Report List</h3>
        </div>
        <div className="table-actions">
          <input type="text" placeholder="Search report"></input>
          <button>Search</button>
          <button onClick={openAddModal}>+ Add Report</button>
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
export default ReportList;
