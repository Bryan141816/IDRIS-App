import { TableView, Cell } from "../../../components/TableView/table_view";
import './ReportList.scss'
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
    return(
        <TableView tableJSON={response_data}></TableView>
    );
}
export default ReportList