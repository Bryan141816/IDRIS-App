import {
  TableView,
  Cell,
  TableReponse,
} from "../../../components/TableView/table_view";
import "./ReportList.scss";
import { Modal } from "../../../components/Page_Furniture/Modals";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getReportList } from "../../../API_Handler/reponse_dashboard_report_list";

const ReportList = () => {
  const [response_data, setResposeData] = useState<TableReponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getReportList();
        setResposeData(response);
        console.log(response_data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="report-container">
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Details</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Report Type:</span>
            <span>EOD Report</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Status:</span>
            <span>Completed</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Date:</span>
            <span>March 20, 2025</span>
          </div>
          <div className="action-button">
            <button style={{ backgroundColor: "#749AB6" }} onClick={closeModal}>
              Ok
            </button>
            <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      <div className="horizontal-container">
        <div className="navigator-container">
          <Link to="/response_dashboard">Response Dashboard</Link>
          <h3>/Report List</h3>
        </div>
        <div className="table-actions">
          <input type="text" placeholder="Search report"></input>
          <button>Search</button>
          <button>+ Add Report</button>
        </div>
      </div>
      {response_data ? (
        <TableView tableJSON={response_data} onClickCallback={openModal} />
      ) : (
        <div>Loading data...</div>
      )}
    </div>
  );
};
export default ReportList;
