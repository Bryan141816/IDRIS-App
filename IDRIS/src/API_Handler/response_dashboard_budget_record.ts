
// src/api/auth.ts
import { API } from './Axio_API_Handler';


API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getBudgetRecordList(): Promise<any> {
  const response = await API.get("/response_dashboard/budget_record/get_list");
  return response.data;
}
export async function addBudgetRecord(record_type: string, amount: string): Promise<any> {
  const response = await API.post("/response_dashboard/budget_record/add_record", {
    budget_record_type: record_type,
    amount: amount
  });
  return response.data;
}

export async function deleteBudgetRecord(recordId: String): Promise<any> {
  try {
    const response = await API.delete(`/response_dashboard/budget_record/delete_record/${recordId}`)
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

export async function updateBudgetRecord(recordId: String, record_type: String, amount: string) {
  try {
    const response = await API.put(`/response_dashboard/budget_record/update_record/${recordId}`, {
      budget_record_type: record_type,
      amount: amount
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
