import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { faBell } from "@fortawesome/free-solid-svg-icons/faBell";
import { useNotifications } from "../../NotificationContext";
export const NotificationsButton = () => {
  const { notifications } = useNotifications();

  // check if any notification is unread
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div style={{ position: "relative" }}>
      {hasUnread && (
        <div
          style={{
            position: "absolute",
            top: "0",
            right: "0",
            backgroundColor: "red",
            color: "white",
            padding: "6px",
            transform: "translateX(+2px) translateY(-2px)",
            borderRadius: "100%",
          }}
        />
      )}
      <Link
        to="/notifications"
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "16px",
          fontWeight: "600",
          backgroundColor: "#749AB6",
          boxSizing: "border-box",
          height: "100%",
          padding: "8px ",
          borderRadius: "20px",
          color: "white",
          aspectRatio: "1/1",
        }}
      >
        <FontAwesomeIcon icon={faBell} />
      </Link>
    </div>
  );
};
