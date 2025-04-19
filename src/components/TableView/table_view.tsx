import { ReactNode } from 'react';
import './table-view.scss';

interface TableProps{
    children: ReactNode;
}
export interface Cell{
    type: "Text" | "Button";
    text: string;
    width?: string;
    container_width?: string;
    button_width?: string;
}
interface TableCellProps{
    cell: Cell;
}

export const TableHead: React.FC<TableProps> = ({children}) => {
    return (
        <div className="row">{children}</div>
    );
}
export const TableData: React.FC<TableProps> = ({children}) => {
    return (
        <div className="row table-data">{children}</div>
    )
}
export const TableCell: React.FC<TableCellProps> = ({cell}) => {
    if(cell.type === "Text"){
        return (<span style={{width: cell.width}}>{cell.text}</span>);
    }
    if(cell.type === "Button"){
        return (
            <div style={{width: cell.container_width}} className='button-container'>
                <button style={{width: cell.button_width}}>{cell.text}</button>
            </div>
        )
    }
}

