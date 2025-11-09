import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { API } from "./API_Handler/Axio_API_Handler";
import { RealTimeDataContext } from "./RealTimeDataContext";
import { useUserContext } from "./UserContext"; // <-- import your user context

type NotificationType = {
  notification_id: number;
  title: string;
  message: string;
  url_redirect: string;
  date: string;
  isRead: boolean;
  from_origin?: string;
};

type NotificationContextType = {
  notifications: NotificationType[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationType[]>>;
  refreshNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { event, connected } = useContext(RealTimeDataContext);
  const { userId } = useUserContext(); // <-- get user info here
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const fetchNotifications = async () => {
    if (!userId) return; // <-- don't fetch if no user
    try {
      const res = await API.get<NotificationType[]>("/get_notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // fetch on mount **and whenever userId changes**
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  // fetch again whenever SSE reconnects, only if user exists
  useEffect(() => {
    if (connected && userId) {
      console.log("SSE reconnected → refetching notifications");
      fetchNotifications();
    }
  }, [connected, userId]);

  // append real-time notifications
  useEffect(() => {
    if (event?.event_type === "notification" && userId) {
      setNotifications((prev) => [event.data, ...(prev || [])]);
    }
  }, [event, userId]);

  // rerender periodically for "time ago"
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        refreshNotifications,
      }}
    >
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
