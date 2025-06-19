
// src/api/auth.ts
import { API } from './Axio_API_Handler';

export async function getReportList(): Promise<any> {
  const response = await API.get('/report_list');
  return response.data;
}

export async function addResponseReport(reportType: string): Promise<any> {
  const response = await API.post("/response_dashboard/report_list/add_report", {
    report_type: reportType,
    status: "Filed"
  });
  return response.data;
}

export async function deleteResponseReport(reportId: String): Promise<any> {
  try {
    const response = await API.delete(`/response_dashboard/report_list/delete_report/${reportId}`)
    return response;
  }
  catch (error: any) {
    if (error.response) {
      console.error("Error: ", error.response.data.detail);
    }
    else {
      console.error("Request error: ", error.message);
    }
  }
}

export async function updateResponseReport(reportId: String, report_type: String, report_status: String) {
  try {
    const response = await API.put(`/response_dashboard/report_list/update_report/${reportId}`, {
      report_type: report_type,
      status: report_status
    });
    return { sucess: true, data: response.data };
  }
  catch (error: any) {
    if (error.respose) {
      console.error("Error: ", error.response.data.detail);
      return { sucess: false, error: error.response?.data?.detail || error.message };
    }
    else {
      console.error("Request error: ", error.message);
      return { sucess: false, error: "An unexpected error occured." }
    }
  }
}
