import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { ModalOverlay } from "../ProcurementModalsDefault";
import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { formatCurrency } from "../ProcurementDefaults";
import { useState } from "react";
import { ProcurementRequest } from "../ProcurementDefaults";
interface AcceptRequestProps extends ProcurementDefaultModalProps {
  selectedItem: ProcurementRequest | null;
}
export const ApproveRequest: React.FC<AcceptRequestProps> = ({
  onClose,
  refreshData,
  selectedItem,
}) => {
  return (
    <ModalOverlay onClose={onClose} onSubmit={() => {}} modalType="approve">
      <></>
    </ModalOverlay>
  );
};
