import React, { ReactNode, useEffect, useState } from "react";
import "./table-view.scss";
import { API } from "../../API_Handler/Axio_API_Handler";
import PageLoader from "../Page_Furniture/Loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSortDesc, faSortAsc } from "@fortawesome/free-solid-svg-icons";
interface TableProps {
  children: ReactNode;
}
interface TableRowProps {
  children: ReactNode;
  iSborder: boolean;
}
export interface Cell {
  type: "Text" | "Button" | "Image" | "Hidden" | "Date" | "Status";
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
  action?: string;
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
  updateTable?: (fn: () => void) => void;
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
  if (cell.type === "Status") {
    return (
      <span
        style={{
          width: cell.width,
          maxWidth: cell.width,
          backgroundColor: cell.background_color + "20",
          color: cell.color,
          fontWeight: cell.font_weight,
          padding: "5px",
          textAlign: "center",
          borderRadius: "10px",
        }}
        title={cell.text}
        className="table-cell"
      >
        {cell.text}
      </span>
    );
  }
  return null;
};

export const TableView: React.FC<TableViewProps> = ({
  tableJSON,
  onClickCallback,
  setCallbackTableData,
  pageRequest,
  updateTable,
}) => {
  const [sortState, setSortState] = useState<Record<string, "desc" | "asc">>(
    {},
  );
  const [additionalQueryString, setAdditionalQueryString] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalCount = tableJSON.count;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const [displayedRows, setDisplayRows] = useState<TableDataRow[] | null>(null);

  const [isloadingPage, setIsLoadingPage] = useState(false);
  // Pagination logic
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const reloadTable = () => {
    tableJSON.table_datas = [];
    setSortState({});
    getTableData();
  };

  useEffect(() => {
    if (updateTable) {
      updateTable(reloadTable);
    }
  }, [updateTable]);

  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const toggleSortState = (event: React.MouseEvent<HTMLButtonElement>) => {
    const buttonClicked = event.currentTarget.name;

    setSortState((prev) => {
      const newValue: "desc" | "asc" =
        prev[buttonClicked] === "desc"
          ? "asc"
          : prev[buttonClicked] === "asc"
            ? "desc"
            : "desc";

      const newState: Record<string, "desc" | "asc"> = {
        ...prev,
        [buttonClicked]: newValue,
      };
      console.log(newState);
      const sortQuery = Object.entries(newState)
        .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      console.log(sortQuery);
      setAdditionalQueryString(sortQuery);

      return newState;
    });
    tableJSON.table_datas = [];
  };

  useEffect(() => {
    let sortHeaderObj = {};
    tableJSON.table_head.map((header) => {
      if (header.action) {
        const key = header.text.replace(/\s+/g, "_");
        sortHeaderObj = {
          ...sortHeaderObj,
          [key]: "desc",
        };
      }
    });
    setSortState(sortHeaderObj);
  }, []);

  const getDefaultPage = (page: number) =>
    Math.floor((page - 1) / 100) * 100 + 1;

  const fetchPage = async (pageToFetch: number) => {
    if (!pageRequest) return;

    setIsLoadingPage(true);
    const response = await API.get(
      pageRequest + pageToFetch + additionalQueryString,
    );

    const prevTableCount = tableJSON.count;

    tableJSON.table_datas.push(...response.data.table_datas);
    tableJSON.count = response.data.count;

    const newTableCount = response.data.count;

    function isInSameRange(num1: number, num2: number, range = 10) {
      return Math.floor((num1 - 1) / range) === Math.floor((num2 - 1) / range);
    }

    if (
      newTableCount < prevTableCount &&
      !isInSameRange(newTableCount, currentPage * 10)
    ) {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }

    setIsLoadingPage(false);
  };

  const getTableData = () => {
    const row =
      tableJSON.table_datas.find((item) => item.page === currentPage)?.row ??
      null;

    if (!row) {
      const pageCount = getDefaultPage(currentPage);
      fetchPage(pageCount).then(() => {
        const newRow =
          tableJSON.table_datas.find((item) => item.page === currentPage)
            ?.row ?? null;
        setDisplayRows(newRow ?? null);
      });
    } else {
      setDisplayRows(row);

      if (currentPage % 10 === 0) {
        const nextRow = tableJSON.table_datas.find(
          (item) => item.page === currentPage + 1,
        )?.row;

        if (!nextRow) {
          fetchPage(currentPage + 1);
        }
      }
    }
  };

  useEffect(() => {
    getTableData();
  }, [currentPage, additionalQueryString]);
  return (
    <div id="table-container">
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignContent: "center",
          paddingLeft: "10px",
          marginTop: "5px",
          marginBottom: "5px",
        }}
      >
        <span style={{ fontWeight: "700" }}>
          Showing{" "}
          {totalCount > 10 && (
            <>
              {(currentPage - 1) * 10 + 1}-
              <>
                {currentPage * 10 > totalCount ? (
                  <>{totalCount}</>
                ) : (
                  <>{currentPage * 10}</>
                )}
              </>{" "}
              of{" "}
            </>
          )}
          {totalCount} records
        </span>
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
      <TableHead>
        {tableJSON.table_head.map((header) => (
          <>
            {header.action ? (
              header.action === "Sort" && (
                <button
                  key={header.text}
                  style={{ width: header.width }}
                  className="table-head-button"
                  onClick={toggleSortState}
                  name={header.text.replace(/\s+/g, "_")}
                >
                  {header.text}{" "}
                  <FontAwesomeIcon
                    icon={
                      sortState[header.text.replace(/\s+/g, "_")] === "desc"
                        ? faSortDesc
                        : faSortAsc
                    }
                    style={{
                      height: "20px",
                      transform:
                        sortState[header.text.replace(/\s+/g, "_")] === "desc"
                          ? "translateY(-2px)"
                          : "translateY(8px)",
                    }}
                  />
                </button>
              )
            ) : (
              <h3 key={header.text} style={{ width: header.width }}>
                {header.text}
              </h3>
            )}
          </>
        ))}
      </TableHead>

      <div id="table-data-container">
        {isloadingPage ? (
          <div style={{ height: "50vh" }}>
            <PageLoader />
          </div>
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
    </div>
  );
};
