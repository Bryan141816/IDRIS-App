import { API } from "./Axio_API_Handler";

type NotificationPayload = {
  title: string;
  message: string;
  url_redirect: string;
  donors: string[];
};

export const createNotification = async (payload: NotificationPayload) => {
  try {
    const response = await API.post("/create_notification", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};
