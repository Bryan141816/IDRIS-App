import { ReactNode, useEffect, useState } from "react";
import "./table-view.scss";
import { API } from "../../API_Handler/Axio_API_Handler";
import PageLoader from "../Page_Furniture/Loader";
interface TableProps {
  children: ReactNode;
}
interface TableRowProps {
  children: ReactNode;
  iSborder: boolean;
}
export interface Cell {
  type: "Text" | "Button" | "Image" | "Hidden" | "Date";
  text: string;
  width?: string;
  value?: string | number | object | any[];
  font_weight: number;
  color?: string;
  container_width?: string;
  button_width?: string;
  background_color?: string;
}

interface TableCellProps {
  cell: Cell;
  onClickCallback: () => void;
}

export interface TableHead {
  text: string;
  width: string;
}
export interface Column {
  page: number;
  data: Cell[];
}

export interface TableDataRow {
  data: Cell[];
}
export interface Pages {
  page: number;
  row: TableDataRow[];
}
export interface TableReponse {
  table_head: TableHead[];
  table_datas: Pages[];
  count: number;
}
interface TableViewProps {
  tableJSON: TableReponse;
  onClickCallback: (row?: any) => void;
  setCallbackTableData: Boolean;
  pageRequest?: string;
}

const TableHead: React.FC<TableProps> = ({ children }) => (
  <div className="row">{children}</div>
);

const TableData: React.FC<TableRowProps> = ({ children }) => (
  <div className="row table-data">{children}</div>
);

const TableCell: React.FC<TableCellProps> = ({ cell, onClickCallback }) => {
  if (cell.type === "Text") {
    return (
      <span
        style={{
          width: cell.width,
          maxWidth: cell.width,
          color: cell.color,
          fontWeight: cell.font_weight,
        }}
        title={cell.text}
        className="table-cell"
      >
        {cell.text}
      </span>
    );
  }
  if (cell.type === "Button") {
    return (
      <div style={{ width: cell.container_width }} className="button-container">
        <button
          style={{
            width: cell.button_width,
            backgroundColor: cell.background_color,
            color: cell.color,
          }}
          onClick={onClickCallback}
        >
          {cell.text}
        </button>
      </div>
    );
  }
  return null;
};

export const TableView: React.FC<TableViewProps> = ({
  tableJSON,
  onClickCallback,
  setCallbackTableData,
  pageRequest,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalCount = tableJSON.count;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const [displayedRows, setDisplayRows] = useState<TableDataRow[] | null>(null);

  const [isloadingPage, setIsLoadingPage] = useState(false);
  // Pagination logic
  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  useEffect(() => {
    setCurrentPage(1);
  }, [tableJSON]);
  useEffect(() => {
    let row =
      tableJSON.table_datas.find((item) => item.page === currentPage)?.row ??
      null;
    if (!row) {
      const fetchPage = async () => {
        setIsLoadingPage(true);
        let pageCount = currentPage;
        if (currentPage % 2 == 0) pageCount--;
        if (pageRequest) {
          const response = await API.get(pageRequest + currentPage);
          tableJSON.table_datas.push(...response.data.table_datas);
          setDisplayRows(
            tableJSON.table_datas.find((item) => item.page === currentPage)
              ?.row ?? null,
          );
          setIsLoadingPage(false);
        }
      };
      fetchPage();
    }
    if (currentPage % 2 !== 0) {
      setDisplayRows(row ?? null);
    } else {
      const next_row = tableJSON.table_datas.find(
        (item) => item.page === currentPage + 1,
      )?.row;
      if (!next_row) {
        const fetchPage = async () => {
          if (pageRequest) {
            const response = await API.get(pageRequest + (currentPage + 1));
            tableJSON.table_datas.push(...response.data.table_datas);
          }
        };
        fetchPage();
      }
    }
  }, [currentPage]);
  return (
    <div id="table-container">
      <div className="pagination">
        {totalCount > 10 && (
          <>
            {startPage > 1 && (
              <button onClick={() => setCurrentPage(currentPage - 1)}>
                {"<"}
              </button>
            )}

            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={num === currentPage ? "current-page" : ""}
              >
                {num}
              </button>
            ))}

            {endPage < totalPages && (
              <button onClick={() => setCurrentPage(currentPage + 1)}>
                {">"}
              </button>
            )}
          </>
        )}
      </div>
      <TableHead>
        {tableJSON.table_head.map((header) => (
          <h3 key={header.text} style={{ width: header.width }}>
            {header.text}
          </h3>
        ))}
      </TableHead>

      <div id="table-data-container">
        {isloadingPage ? (
          <PageLoader />
        ) : (
          <>
            {displayedRows &&
              displayedRows.map((row, rowIndex) => (
                <TableData
                  key={rowIndex}
                  iSborder={rowIndex !== displayedRows.length - 1}
                >
                  {row.data.map((cellValue, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      cell={cellValue}
                      onClickCallback={() => {
                        if (setCallbackTableData) {
                          onClickCallback(row);
                        } else {
                          onClickCallback();
                        }
                      }}
                    />
                  ))}
                </TableData>
              ))}
          </>
        )}
      </div>

      <div className="pagination">
        {totalCount > 10 && (
          <>
            {startPage > 1 && (
              <button onClick={() => setCurrentPage(currentPage - 1)}>
                {"<"}
              </button>
            )}

            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={num === currentPage ? "current-page" : ""}
              >
                {num}
              </button>
            ))}

            {endPage < totalPages && (
              <button onClick={() => setCurrentPage(currentPage + 1)}>
                {">"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
