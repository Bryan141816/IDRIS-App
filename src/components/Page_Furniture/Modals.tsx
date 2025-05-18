import React, { ReactNode } from 'react';
import style from './modal.module.scss';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={style.modalOverlay}>
      <div className={style.modalContent}>
        <button className={style.closeBtn} onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};
