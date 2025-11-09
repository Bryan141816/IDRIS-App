import "../../pages/procurement_inventory/ProcurementInventory.scss";
import { useNotifications } from "../../NotificationContext";
import { API } from "../../API_Handler/Axio_API_Handler";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    notification_id: number;
    title: string;
    message: string;
    url_redirect: string;
    date: string;
    isRead: boolean;
    from_origin?: string;
};

const NotificationPage = () => {
    const navigate = useNavigate();
    const { notifications, refreshNotifications } = useNotifications();
    const [respondingTo, setRespondingTo] = useState<number | null>(null);

    // Extract members_id from url_redirect if it's an assignment notification
    const extractMembersId = (url: string): number | null => {
        // Assuming URL format: /volunteer/assignment/123 or similar
        const match = url.match(/\/assignment\/(\d+)/);
        return match ? parseInt(match[1]) : null;
    };

    // Check if notification is a team assignment
    const isTeamAssignment = (notification: NotificationType): boolean => {
        return (
            notification.from_origin === "Distribution Planning" &&
            notification.title.includes("Team Assignment")
        );
    };

    const handleAssignmentResponse = async (
        notification: NotificationType,
        status: 'accepted' | 'rejected',
        event: React.MouseEvent
    ) => {
        event.stopPropagation(); // Prevent notification click

        const membersId = extractMembersId(notification.url_redirect);

        if (!membersId) {
            return;
        }

        setRespondingTo(notification.notification_id);

        try {
            const response = await API.put(
                `/distribution_planning/respond_to_assignment/${membersId}`,
                null,
                { params: { status } }
            );

            if (response.status === 200) {


                // Mark notification as read
                await API.post(`/notifications/mark_as_read`, notification);

                // Refresh notifications
                if (refreshNotifications) {
                    refreshNotifications();
                }
            }
        } catch (error: any) {
            console.error(`Error ${status} assignment:`, error);

        } finally {
            setRespondingTo(null);
        }
    };

    const handleNotificationClick = (notification_value: NotificationType) => {
        // Don't navigate if it's a team assignment (let them use buttons instead)
        if (isTeamAssignment(notification_value) && !notification_value.isRead) {
            return;
        }

        console.log(notification_value);

        API.post(`/notifications/mark_as_read`, notification_value).catch((err) => {
            console.error("Failed to mark notification as read:", err);
        });

        if (notification_value.url_redirect) {
            const url = new URL(notification_value.url_redirect, window.location.origin);
            const fundingId = url.searchParams.get("funding_id");
        
            if (fundingId) {
                navigate(url.pathname, { state: { funding_id: fundingId } });
            } else {
                window.location.href = notification_value.url_redirect;
            }
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
                {notifications.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#999",
                        backgroundColor: "white",
                        borderRadius: "20px"
                    }}>
                        <p>No notifications</p>
                    </div>
                ) : (
                    notifications.map((msg) => {
                        const isAssignment = isTeamAssignment(msg);
                        const isLoading = respondingTo === msg.notification_id;

                        return (
                            <div
                                key={msg.notification_id}
                                style={{
                                    display: "flex",
                                    width: "100%",
                                    backgroundColor: msg.isRead ? "#f5f5f5" : "white",
                                    flexDirection: "column",
                                    gap: "10px",
                                    padding: "20px",
                                    borderRadius: "20px",
                                    border: msg.isRead ? "1px solid #e0e0e0" : "2px solid #1890FF",
                                    position: "relative",
                                }}
                            >
                                {/* Unread indicator */}
                                {!msg.isRead && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "10px",
                                            right: "10px",
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            backgroundColor: "#1890FF",
                                        }}
                                    />
                                )}

                                <button
                                    style={{
                                        all: "unset",
                                        cursor: isAssignment && !msg.isRead ? "default" : "pointer",
                                        width: "100%",
                                    }}
                                    onClick={() => handleNotificationClick(msg)}
                                >
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                                            {msg.title || "New Notification"}
                                        </span>
                                        <span style={{ fontWeight: msg.isRead ? "400" : "600" }}>
                                            {msg.message}
                                        </span>
                                        <span style={{ fontSize: "0.9rem", color: "gray" }}>
                                            {formatTimeAgo(msg.date)}
                                        </span>
                                    </div>
                                </button>

                                {/* Accept/Decline buttons for team assignments */}
                                {isAssignment && !msg.isRead && (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            marginTop: "10px",
                                            paddingTop: "10px",
                                            borderTop: "1px solid #e0e0e0",
                                        }}
                                    >
                                        <button
                                            onClick={(e) => handleAssignmentResponse(msg, 'accepted', e)}
                                            disabled={isLoading}
                                            style={{
                                                flex: 1,
                                                padding: "12px 20px",
                                                backgroundColor: isLoading ? "#ccc" : "#749AB6",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: isLoading ? "not-allowed" : "pointer",
                                                fontWeight: "600",
                                                fontSize: "14px",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseOver={(e) => {
                                                if (!isLoading) {
                                                    e.currentTarget.style.backgroundColor = "#5a8ca8";
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (!isLoading) {
                                                    e.currentTarget.style.backgroundColor = "#749AB6";
                                                }
                                            }}
                                        >
                                            {isLoading ? "Processing..." : "Accept"}
                                        </button>
                                        <button
                                            onClick={(e) => handleAssignmentResponse(msg, 'rejected', e)}
                                            disabled={isLoading}
                                            style={{
                                                flex: 1,
                                                padding: "12px 20px",
                                                backgroundColor: isLoading ? "#ccc" : "#f5222d",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: isLoading ? "not-allowed" : "pointer",
                                                fontWeight: "600",
                                                fontSize: "14px",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseOver={(e) => {
                                                if (!isLoading) {
                                                    e.currentTarget.style.backgroundColor = "#cf1322";
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (!isLoading) {
                                                    e.currentTarget.style.backgroundColor = "#f5222d";
                                                }
                                            }}
                                        >
                                            {isLoading ? "Processing..." : "Decline"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default NotificationPage;
