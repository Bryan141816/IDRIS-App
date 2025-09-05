import { useEffect, useState } from "react";

export const NotificationsButton = ({ userId }) => {
  return (
    <div>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: "#749AB6",
          boxSizing: "border-box",
          height: "100%",
          padding: "10px 15px",
          borderRadius: "20px",
        }}
      >
        Notifications
      </button>
    </div>
  );
};

// function Notifications({ userId }) {
//   const [messages, setMessages] = useState([]);
//
//   useEffect(() => {
//     // Connect to SSE endpoint
//     const evtSource = new EventSource(
//       `http://localhost:8000/notifications/${userId}`,
//     );
//
//     // Listen for incoming messages
//     evtSource.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         setMessages((prev) => [...prev, data.message]);
//       } catch (err) {
//         console.error("Failed to parse SSE message:", err);
//       }
//     };
//
//     // Optional: handle errors
//     evtSource.onerror = (err) => {
//       console.error("SSE connection error:", err);
//       // evtSource.close(); // optional: close on error
//     };
//
//     // Cleanup when component unmounts
//     return () => {
//       evtSource.close();
//     };
//   }, [userId]);
//
//   return (
//     <div>
//       <h3>Notifications</h3>
//       <ul>
//         {messages.map((msg, idx) => (
//           <li key={idx}>{msg}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }
//
// export default Notifications;
