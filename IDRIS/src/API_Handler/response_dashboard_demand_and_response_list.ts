

// src/api/auth.ts
import { API } from './Axio_API_Handler';

export async function getDemandList(): Promise<any> {
  const response = await API.get("/response_dashboard/demand_and_response/list_view");
  return response.data;
}
type NeedItem = {
  id: number;
  need: string;
  amount: string;
};
type Demand = {
  title_lable: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status: string;
  needs: NeedItem[];
  priority: string;

}
export async function addRecord(demand: Demand): Promise<any> {
  const response = await API.post("/response_dashboard/demand_and_response/add_record", demand);
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
