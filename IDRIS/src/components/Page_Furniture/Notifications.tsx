import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "react-router-dom";
import { faBell } from "@fortawesome/free-solid-svg-icons/faBell";
import { useNotifications } from "../../NotificationContext";
import { RealTimeDataContext } from "../../RealTimeDataContext";
import { useEffect, useContext, useState } from "react";

export const NotificationsButton = () => {
  const { notifications } = useNotifications();
  const { event } = useContext(RealTimeDataContext);
  const location = useLocation();

  const [showNewBox, setShowNewBox] = useState(false);

  // Show popup only if NOT currently on /notifications
  useEffect(() => {
    if (
      event &&
      event.event_type === "notification" &&
      location.pathname !== "/notifications"
    ) {
      setShowNewBox(true);
      const timer = setTimeout(() => setShowNewBox(false), 3000); // hide after 3s
      return () => clearTimeout(timer);
    }
  }, [event]);

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Notification popup box */}
      {showNewBox && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: "8px",
            backgroundColor: "rgb(116, 154, 182)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "16px",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            animation: "fadeInOut 3s ease",
            zIndex: 1000,
          }}
        >
          <FontAwesomeIcon icon={faBell} /> New notification received!
        </div>
      )}

      {/* Red dot indicator for unread notifications */}
      {hasUnread && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            backgroundColor: "red",
            color: "white",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
          }}
        />
      )}

      {/* Notification button */}
      <Link
        to="/notifications"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "600",
          backgroundColor: "#749AB6",
          height: "40px",
          width: "40px",
          borderRadius: "50%",
          color: "white",
          textDecoration: "none",
        }}
      >
        <FontAwesomeIcon icon={faBell} />
      </Link>

      {/* Optional animation style */}
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, 10px); }
            10% { opacity: 1; transform: translate(-50%, 0); }
            90% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, 10px); }
          }
        `}
      </style>
    </div>
  );
};
