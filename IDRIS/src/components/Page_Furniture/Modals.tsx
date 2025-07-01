import { ReactNode } from "react";
import style from "./styles/modal.module.scss";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  zIndex?: number; // optional zIndex for stacking
  width?: string;
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  zIndex,
  width,
}) => {
  if (!isOpen) return null;

  const effectiveZIndex = zIndex ?? 1000; // fallback default
  const effectiveMaxWidth = width ?? "500px";
  
  return (
    <div className={style.modalOverlay} style={{ zIndex: effectiveZIndex }}>
      <div
        className={style.modalContent}
        style={{ maxWidth: effectiveMaxWidth }}
      >
        <button className={style.closeBtn} onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
};
