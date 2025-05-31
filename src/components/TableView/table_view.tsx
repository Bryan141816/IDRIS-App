import { ReactNode } from 'react';
import './table-view.scss';

interface TableProps{
    children: ReactNode;
}
interface TableRowProps{
    children: ReactNode;
    iSborder: boolean;
}
export interface Cell {
    type: "Text" | "Button" | "Image";
    text: string;
    width?: string;
    font_weight: number;
    color?: string;
    container_width?: string;
    button_width?: string;
    background_color?: string;
  }
  
interface TableCellProps {
    cell: Cell;
    onClickCallback: ()=>void;
}

export interface TableHead {
  text: string;
  width: string;
}

export interface TableDataRow {
  data: Cell[];
}

export interface TableReponse {
  table_head: TableHead[];
  table_datas: TableDataRow[];
}
interface TableViewProps{
    tableJSON: TableReponse;
    onClickCallback: ()=>void;
}
  

const TableHead: React.FC<TableProps> = ({children}) => {
    return (
        <div className="row">{children}</div>
    );
}
const TableData: React.FC<TableRowProps> = ({children, iSborder}) => {
    return (
        <div className="row table-data">
            {children}
        </div>
    )
}
const TableCell: React.FC<TableCellProps> = ({cell, onClickCallback}) => {
    if(cell.type === "Text"){
        return (<span style={{minWidth: cell.width, color: cell.color, fontWeight: cell.font_weight}}>{cell.text}</span>);
    }
    if(cell.type === "Button"){
        return (
            <div style={{minWidth: cell.container_width}} className='button-container'>
                <button style={{minWidth: cell.button_width, backgroundColor: cell.background_color, color: cell.color}} onClick={onClickCallback}>{cell.text}</button>
            </div>
        )
    }
}
export const TableView: React.FC<TableViewProps> = ({tableJSON, onClickCallback}) =>{
    return (
        <div id="table-container">
            <TableHead>
                {tableJSON.table_head.map((header,index) => (
                    <h3 key={index} style={{minWidth: header.width}}>{header.text}</h3>
                ))}
            </TableHead>
            <div id="table-data-container">
                {tableJSON.table_datas.map((row, rowIndex)=>(
                    <TableData key={rowIndex} iSborder={rowIndex !== tableJSON.table_datas.length - 1}>
                        {row.data.map((cellValue, cellIndex) => (
                            <TableCell cell={cellValue} onClickCallback={onClickCallback}></TableCell>
                        ))}
                    </TableData>
                ))}
            </div>
        </div>
    )
}


