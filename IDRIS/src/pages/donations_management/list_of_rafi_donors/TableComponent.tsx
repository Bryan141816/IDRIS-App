import React from 'react';
import styles from './TableComponents1.module.scss';

import Rank1 from '../test_images/rank1.png';
import Rank2 from '../test_images/rank2.png';
import Rank3 from '../test_images/rank3.png';
export interface Cell {
  type: 'Text' | 'Image' | 'Date';
  text: string;
  font_weight: number;
  width?: string;
}

export interface TableRow {
  data: Cell[];
}

export interface TableResponse {
  table_head: {
    text: string;
    width: string;
  }[];
  table_datas: TableRow[];
}

interface Props {
  tableData: TableResponse;
}

export const DonorTable: React.FC<Props> = ({ tableData }) => {
  return (
    <table className={styles.table}>
      <thead className={styles.tableHead}>
        <tr>
          {tableData.table_head.map((item, index) => (
            <th key={index} style={{ width: item.width }} >
              {item.text}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={styles.tableBody}>
        {tableData.table_datas.map((row, rowIndex) => (
          <tr key={rowIndex} className={styles.tableRow} >
            {row.data.map((cell, cellIndex) => {
              // Handle Rank cell (first column)
              if (cellIndex === 0 && cell.type === 'Text') {
                const rank = parseInt(cell.text, 10);
                return (
                  <td key={cellIndex} style={{ fontWeight: cell.font_weight }} className={styles.rankCell}>
                    {rank <= 3 ? (
                      <img
                        src={{  1: Rank1, 2: Rank2, 3: Rank3 }[rank]}
                        alt={`Top ${rank}`}
                        width="24px"
                        title={`Top ${rank}`}
                      />
                    ) : (
                      <div className={styles.rankIcon}>
                        <p className={styles.rankNumber}>{cell.text}</p>
                      </div>
                    )}
                  </td>
                );
              }

              // Other text cells
              if (cell.type === 'Text') {
                return (
                  <td key={cellIndex} style={{ fontWeight: cell.font_weight }}  className={styles.rankCell}>
                    {cell.text}
                  </td>
                );
              }

              // Image cell (Avatar)
              if (cell.type === 'Image') {
                return (
                  <td key={cellIndex} className={styles.rankCell}>
                    <img
                      src={cell.text}
                      alt="Avatar"
                      width={cell.width}
                      style={{
                        borderRadius: '50%',
                        objectFit: 'cover',
                        height: cell.width,
                      }}
                    />
                  </td>
                );
              }

              if(cell.type === 'Date'){
                return(
                  <td key={cellIndex} className={`${styles.rankCell} ${styles.dateCell}`}>
                    {new Date(cell.text).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </td>
                )
              }
              return null;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
