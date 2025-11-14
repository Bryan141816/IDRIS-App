import { ModalType } from "./ProcurementDefaults";
import React, { ReactNode } from "react";
export interface ProcurementDefaultModalProps {
  onClose: () => void;
  refreshData: () => void;
  apiUrl?: string | null;
}

export type ButtonHandler = (
  e?: React.MouseEvent<HTMLButtonElement>,
) => void | Promise<void> | null | undefined;

interface ModalProps {
  children: ReactNode;
  modalType: Exclude<ModalType, null>; // ensures no nulls
  onClose: () => void; // or any function signature you need
  onReject?: ButtonHandler;
  onSubmit?: ButtonHandler;
  zIndex?: number;
  minWidth?: string;
}
export const ModalOverlay: React.FC<ModalProps> = ({
  children,
  modalType,
  onClose,
  onSubmit,
  onReject,
  zIndex = 900,
  minWidth = "60vw",
}) => {
  return (
    <div className="modal-overlay" style={{ zIndex }}>
      <form className="modal" style={{ minWidth }} method="POST">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        <div className="modal-actions">
          <button
            className="secondary-btn"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (modalType === "review" || modalType === "view") {
                e.preventDefault();
              }
              onClose();
            }}
          >
            {modalType === "view" ? "Close" : "Cancel"}
          </button>
          {modalType === "review" && (
            <button
              className="primary-btn"
              style={{ background: "red", color: "white" }}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                if (onReject) {
                  onReject(e);
                }
              }}
            >
              Reject
            </button>
          )}
          {modalType !== "view" && (
            <button
              className="primary-btn"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (onSubmit) {
                  onSubmit(e);
                }
              }}
            >
              {modalType === "review" ? "Approve" : "Save"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
