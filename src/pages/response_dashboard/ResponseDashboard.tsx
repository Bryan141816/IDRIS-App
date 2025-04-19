import { TableHead, TableData, TableCell,Cell } from "../../components/TableView/table_view";
import './ResponseDashboard.scss'
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
                { type: "Text", text: "March 20, 2025", width: "150px" } as Cell,
                { type: "Text", text: "EOD Report", width: "250px" } as Cell,
                { type: "Text", text: "Completed", width: "150px" } as Cell,
                { type: "Button", text: "View", container_width: "150px", button_width: "120px" } as Cell
            ]
        },

    ]
}

const ResponseDashboard = () =>{
    return(
        <div id="table-container">
            <TableHead>
                {response_data.table_head.map((header,index) => (
                    <h3 key={index} style={{width: header.width}}>{header.text}</h3>
                ))}
            </TableHead>
            {response_data.table_datas.map((row, rowIndex)=>(
                <TableData key={rowIndex}>
                    {row.data.map((cellValue, cellIndex) => (
                        <TableCell cell={cellValue}></TableCell>
                    ))}
                </TableData>
            ))}
        </div>
    );
}
export default ResponseDashboard