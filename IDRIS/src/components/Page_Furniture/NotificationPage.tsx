import { useState, useEffect } from "react";
import "../../pages/procurement_inventory/ProcurementInventory.scss";
import { useUserContext } from "../../UserContext";

interface Notification {
  title?: string;
  message: string;
}

const NotificationPage = () => {
  const { userId } = useUserContext();
  const [messages, setMessages] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;

    const evtSource = new EventSource(
      `http://localhost:8000/notifications/${userId}`,
    );

    evtSource.onmessage = (event) => {
      try {
        const data: Notification = JSON.parse(event.data); // JSON should match Notification interface
        setMessages((prev) => [data, ...prev]);
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    evtSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      // evtSource.close(); // optional
    };

    return () => {
      evtSource.close();
    };
  }, [userId]);

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
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              width: "100%",
              backgroundColor: "white",
              flexDirection: "column",
              gap: "10px",
              padding: "20px",
              borderRadius: "20px",
            }}
          >
            <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>
              {msg.title || "New Notification"}
            </span>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPage;
