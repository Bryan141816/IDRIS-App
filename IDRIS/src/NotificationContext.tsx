import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { API } from "./API_Handler/Axio_API_Handler";
import { RealTimeDataContext } from "./RealTimeDataContext";

type NotificationType = {
  notification_id: number;
  title: string;
  message: string;
  url_redirect: string;
  date: string; // ISO string
  isRead: boolean;
};

type NotificationContextType = {
  notifications: NotificationType[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationType[]>>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { event } = useContext(RealTimeDataContext);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  // ⬇️ fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await API.get<NotificationType[]>("/get_notifications");
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    fetchNotifications();
  }, []);

  // ⬇️ append real-time notifications
  useEffect(() => {
    if (event?.event_type === "notification") {
      setNotifications((prev) => [event.data, ...(prev || [])]);
    }
  }, [event]);

  // ⬇️ force re-render periodically for "time ago"
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => [...prev]); // trigger rerender
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
};
