import React, { ReactNode } from 'react';
import style from './modal.module.scss';
import Search from '../../../components/Public/Search';
import { useState } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const [searched, searchState] = useState("");

  if (!isOpen) return null;

  return (
    <div className={style.modalOverlay}>
      <div className={style.modalContent}>
        <button className={style.closeBtn} onClick={onClose}>×</button>
        <h3>Add New Donor</h3>
        <div className={style.formContainer}>
          <Search placeholder="Search Donor" value={searched} onChange={searchState} />

        </div>
      </div>
    </div>
  );
};
