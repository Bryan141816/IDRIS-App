import { API } from "../Axio_API_Handler";
import { LGUOut } from "../../pages/lgu_profiling/LGUofficer/Modals/LGUModals";
export const getMyLGULocation = async (): Promise<LGUOut | null> => {
  try {
    const response = await API.get("/lgu_profiling/me/lgu_location");
    console.log(response.data)
    const data = response.data;

    return data ?? null;
  } catch (e: any) {
    console.error("Error fetching LGU location:", e?.message);
    return null;
  }
};

// ✅ make sure this is a NAMED export (not default)
export const getLGURecordByName = async (name: string): Promise<any | null> => {
  try {
    const res = await API.get("/lgu_profiling/manage_lgu/find_lgu_by_name", {
      params: { name },
    });
    return res.data ?? null;
  } catch (e: any) {
    console.error("Error fetching LGU record:", e?.message);
    return null;
  }
};
