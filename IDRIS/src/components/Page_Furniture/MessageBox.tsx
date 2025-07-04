import React from "react";
import { Modal } from "./Modals.tsx";
type MessageBoxProps = {
  isOpen: boolean;
  onClose: () => void;
  type: "message" | "confirm";
  message: string;
  onSubmit?: () => void;
};
import "./styles/MessageBox.scss";
export const MessageBox: React.FC<MessageBoxProps> = ({
  isOpen,
  onClose,
  type,
  message,
  onSubmit,
}) => {
  const getTitle = () => {
    return type === "confirm" ? "Confirm Action" : "Message";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} zIndex={1000}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          padding: "20px",
          paddingTop: "15px",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "14px", color: "#333" }}>{getTitle()}</span>
        <span style={{ width: "100%", textAlign: "center", fontSize: "18px" }}>
          {message}
        </span>

        <div
          style={{ display: "flex", gap: "8px", justifyContent: "end" }}
          className="messagebox-button"
        >
          {type === "confirm" ? (
            <>
              <button
                style={{
                  backgroundColor: "#749AB6",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  padding: "8px 16px",
                  color: "#fff",
                  borderRadius: "4px",
                }}
                onClick={() => {
                  if (onSubmit) {
                    onSubmit();
                  }
                  onClose();
                }}
              >
                Ok
              </button>
              <button
                style={{
                  backgroundColor: "#F84B4D",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  padding: "8px 16px",
                  color: "#fff",
                  borderRadius: "4px",
                }}
                onClick={onClose}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              style={{
                backgroundColor: "#749AB6",
                border: "none",
                outline: "none",
                cursor: "pointer",
                padding: "8px 16px",
                color: "#fff",
                borderRadius: "4px",
              }}
              onClick={onClose}
            >
              Ok
            </button>
          )}{" "}
        </div>
      </div>
    </Modal>
  );
};
