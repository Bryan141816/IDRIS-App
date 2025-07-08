
// src/api/auth.ts
import { API } from './Axio_API_Handler';


API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getModalityList(): Promise<any> {
  const response = await API.get("/response_dashboard/modality_distribution/record_list");
  return response.data;
}
export async function addModalityRecord(modalityType: string): Promise<any> {
  const response = await API.post("/response_dashboard/modality_distribution/add_record", {
    modality_type: modalityType
  });
  return response.data;
}

export async function deleteModalityRecord(recordId: String): Promise<any> {
  try {
    const response = await API.delete(`/response_dashboard/modality_distribution/delete_record/${recordId}`)
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

export async function updateModalityRecord(recordId: String, modalityType: String) {
  try {
    const response = await API.put(`/response_dashboard/modality_distribution/update_record/${recordId}`, {
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
