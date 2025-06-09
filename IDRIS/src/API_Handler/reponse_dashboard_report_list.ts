
// src/api/auth.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

export async function getReportList(): Promise<any> {
  const response = await API.get('/report_list');
  console.log(response.data)
  return response.data;
}

export async function addResponseReport(reportType: string): Promise<any> {
  const response = await API.post("/response_dashboar/report_list/add_report", {
    report_type: reportType,
    status: "Filed"
  });
  return response.data;
}
