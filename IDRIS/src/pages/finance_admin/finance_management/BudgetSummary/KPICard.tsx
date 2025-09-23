// KPICard.tsx
import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: "blue" | "green" | "red" | "yellow" | "orange";
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, color = "blue" }) => {
  const colorMap = {
    blue: { bg: "#dbeafe", text: "#2563eb" },
    green: { bg: "#dcfce7", text: "#16a34a" },
    red: { bg: "#fee2e2", text: "#dc2626" },
    yellow: { bg: "#fef3c7", text: "#d97706" },
    orange: { bg: "#fed7aa", text: "#ea580c" },
  };

  const colors = colorMap[color];

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.5rem",
        border: "2px solid #9ca3af",
        padding: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: "1.125rem",
              fontWeight: "bold",
              marginTop: "0.25rem",
              color: colors.text,
            }}
          >
            {value}
          </p>
        </div>
        <div
          style={{
            padding: "0.5rem",
            borderRadius: "9999px",
            backgroundColor: colors.bg,
          }}
        >
          <Icon style={{ height: "1rem", width: "1rem", color: colors.text }} />
        </div>
      </div>
    </div>
  );
};

export default KPICard;
