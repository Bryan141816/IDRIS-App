import "../../pages/procurement_inventory/ProcurementInventory.scss";
import { useNotifications } from "../../NotificationContext";
import { API } from "../../API_Handler/Axio_API_Handler";
function formatTimeAgo(isoString: string) {
  const targetDate = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "1 day ago";

  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const yyyy = targetDate.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

type NotificationType = {
  notification_id: string;
  title: string;
  message: string;
  url_redirect: string;
  date: string; // ISO string
  isRead: boolean;
};

const NotificationPage = () => {
  const { notifications } = useNotifications();

  const handleNotificationClick = (notification_value: NotificationType) => {
    console.log(notification_value);

    // fire-and-forget axios request
    API.post(`/notifications/mark_as_read`, notification_value).catch((err) => {
      // optional: just log error, don't block UI
      console.error("Failed to mark notification as read:", err);
    });

    // immediately proceed with UI action
    if (notification_value.url_redirect) {
      window.location.href = notification_value.url_redirect;
    }
  };
  return (
    <div className="procurement-management">
      <h3 className="public-feed-title">Notifications</h3>
      <div
        className="mains-content"
        style={{
          padding: "20px",
          gap: "10px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {notifications.map((msg) => (
          <button
            key={msg.notification_id}
            style={{
              display: "flex",
              width: "100%",
              backgroundColor: "white",
              flexDirection: "column",
              gap: "10px",
              padding: "20px",
              borderRadius: "20px",
              justifyContent: "start",
              alignItems: "start",
            }}
            onClick={() => {
              handleNotificationClick(msg);
            }}
          >
            <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>
              {msg.title || "New Notification"}
            </span>
            <span style={{ fontWeight: msg.isRead ? "500" : "600" }}>
              {msg.message}
            </span>
            <span style={{ fontSize: "0.9rem", color: "gray" }}>
              {formatTimeAgo(msg.date)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotificationPage;
