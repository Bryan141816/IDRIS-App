import React from 'react';
import styles from './transparency_table.module.scss'; // Create your own styles or reuse
import { useUserContext } from "../../../UserContext";

const backendUrl = 'http://127.0.0.1:8000';

export interface TransparencyReport {
  id: number;
  file_name: string;
  file: string; // Full URL or path to PDF
  date_uploaded: string; // ISO date string
}

interface Props {
  reports: TransparencyReport[];
  updateFunction?: (id: number ) => void | Promise <void>;
}

export const TransparencyReportTable: React.FC<Props> = ({ reports, updateFunction }) => {
  const { userType } = useUserContext();

  return (
    <table className={styles.transparencyTable}>
      <thead>
        <tr>
          <th style={{ width: '50%' }}>File Name</th>
          <th style={{ width: '25%' }}>Date Uploaded</th>
          <th style={{ width: '10%' }}>Download</th>
          {userType == "admin" && <th style={{ width: '15%' }}>Action</th>}
        </tr>
      </thead>
      <tbody>
        {reports.map((report) => (
          <tr key={report.id}>
            <td>
              <a
                href={`${backendUrl}/${report.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fileLink}
                title="View PDF"
              >
                {report.file_name}
              </a>
            </td>
            <td>
              {new Date(report.date_uploaded).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </td>
            <td>
              <a
                href={`${backendUrl}/${report.file}`}
                download
                className={styles.downloadButton}
                title="Download PDF"
              >
                Download
              </a>
            </td>
            { userType == "admin" && <td>
              <button
                className={styles.yellowButton}
                onClick={() => updateFunction?.(report.id)}
              >
                Update
              </button>
            </td> }
          </tr>
        ))}
      </tbody>
    </table>
  );
};
