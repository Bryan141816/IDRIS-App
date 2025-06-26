
// src/api/auth.ts
import { API } from './Axio_API_Handler';

export async function getInKindList(): Promise<any> {
  const response = await API.get("/response_dashboard/in_kind_monitoring/record_list");
  return response.data;
}
export async function addRecord(record_type: string, quantity: number): Promise<any> {
  const response = await API.post("/response_dashboard/in_kind_monitoring/add_record", {
    record_type: record_type,
    quantity: quantity
  });
  return response.data;
}

export async function deleteRecord(recordId: String): Promise<any> {
  try {
    const response = await API.delete(`/response_dashboard/in_kind_monitoring/delete_record/${recordId}`)
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

export async function updateRecord(recordId: String, modalityType: String) {
  try {
    const response = await API.put(`/response_dashboard/in_kind_monitoring/update_record/${recordId}`, {
      modality_type: modalityType,
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
export async function markAsDelivered(recordId: String) {
  try {
    const response = await API.put(`/response_dashboard/in_kind_monitoring/mark_as_delivered/${recordId}`)
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
