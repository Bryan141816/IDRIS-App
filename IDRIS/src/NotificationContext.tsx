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
    from_origin?: string; // Add this for checking notification type
};

type NotificationContextType = {
    notifications: NotificationType[];
    setNotifications: React.Dispatch<React.SetStateAction<NotificationType[]>>;
    refreshNotifications: () => Promise<void>; // Add this
};

const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { event, connected } = useContext(RealTimeDataContext);
    const [notifications, setNotifications] = useState<NotificationType[]>([]);

    const fetchNotifications = async () => {
        try {
            const res = await API.get<NotificationType[]>("/get_notifications");
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    };

    // Add this function - it's just an alias to fetchNotifications
    const refreshNotifications = async () => {
        await fetchNotifications();
    };

    // fetch on mount
    useEffect(() => {
        fetchNotifications();
    }, []);

    // fetch again whenever SSE reconnects
    useEffect(() => {
        if (connected) {
            console.log("SSE reconnected → refetching notifications");
            fetchNotifications();
        }
    }, [connected]);

    // append real-time notifications
    useEffect(() => {
        if (event?.event_type === "notification") {
            setNotifications((prev) => [event.data, ...(prev || [])]);
        }
    }, [event]);

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
                refreshNotifications // Add this
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
