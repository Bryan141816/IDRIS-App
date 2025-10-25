import { API } from "../Axio_API_Handler"; 

export const getMyLGULocation = async (): Promise<string | null> => {
  try {
    const response = await API.get("/lgu_profiling/me/lgu_location");
    const data = response.data;

    return data?.lgu_location ?? null;
  } catch (e: any) {
    if (e.message) {
      console.error("Error fetching LGU location: " + e.message);
    }
    return null; 
  }
};
    