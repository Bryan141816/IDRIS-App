import { TableView, Cell } from "../../../components/TableView/table_view";
import './ReportList.scss'
import { Modal } from '../../../components/Page_Furniture/Modals';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
const response_data = {
    table_head: [
        {
            text: "Date",
            width: "150px",
        },
        {
            text: "Report Type",
            width: "250px",
        },
        {
            text: "Status",
            width: "150px",
        },
        {
            text: "Actions",
            width: "150px",
        }
    ],
    table_datas: [
        {
            data: [
                { type: "Text", font_weight: 500,color: "#000",text: "March 20, 2025", width: "150px" } as Cell,
                { type: "Text", font_weight: 500,color: "#000",text: "EOD Report", width: "250px" } as Cell,
                { type: "Text", font_weight: 700,color: "#22A900",text: "Completed", width: "150px" } as Cell,
                { type: "Button", font_weight: 500, color: "#fff",background_color: "#749AB6",text: "View", container_width: "150px", button_width: "120px" } as Cell
            ]
        },
        {
            data: [
                { type: "Text", font_weight: 500,color: "#000",text: "March 20, 2025", width: "150px" } as Cell,
                { type: "Text", font_weight: 500,color: "#000",text: "EOD Report", width: "250px" } as Cell,
                { type: "Text", font_weight: 700,color: "#22A900",text: "Completed", width: "150px" } as Cell,
                { type: "Button", font_weight: 500, color: "#fff",background_color: "#749AB6",text: "View", container_width: "150px", button_width: "120px" } as Cell
            ]
        },
        {
            data: [
                { type: "Text", font_weight: 500,color: "#000",text: "March 20, 2025", width: "150px" } as Cell,
                { type: "Text", font_weight: 500,color: "#000",text: "EOD Report", width: "250px" } as Cell,
                { type: "Text", font_weight: 700,color: "#22A900",text: "Completed", width: "150px" } as Cell,
                { type: "Button", font_weight: 500, color: "#fff",background_color: "#749AB6",text: "View", container_width: "150px", button_width: "120px" } as Cell
            ]
        },
        {
            data: [
                { type: "Text", font_weight: 500,color: "#000",text: "March 20, 2025", width: "150px" } as Cell,
                { type: "Text", font_weight: 500,color: "#000",text: "EOD Report", width: "250px" } as Cell,
                { type: "Text", font_weight: 700,color: "#22A900",text: "Completed", width: "150px" } as Cell,
                { type: "Button", font_weight: 500, color: "#fff",background_color: "#749AB6",text: "View", container_width: "150px", button_width: "120px" } as Cell
            ]
        },
    ]
}

const ReportList = () =>{
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    return(
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
                        <button style={{backgroundColor: "#749AB6"}} onClick={closeModal}>Ok</button>
                        <button style={{backgroundColor: "#F84B4D"}} onClick={closeModal}>Cancel</button>
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
            <TableView tableJSON={response_data} onClickCallback={openModal} ></TableView>
        </div>
    );
}
export default ReportList