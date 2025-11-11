import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { ModalOverlay } from "../ProcurementModalsDefault";
import React, { useState, useEffect } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";

interface SelectBarangayEvacuationProp extends ProcurementDefaultModalProps {
  setSelectedLocation: (id: number, name: string, type: string) => void;
}
type ListProp = {
  id: number;
  name: string;
  type: string;
};
export const SelectBarangayEvacuation: React.FC<
  SelectBarangayEvacuationProp
> = ({ onClose, setSelectedLocation }) => {
  const [locationList, setLocationList] = useState<ListProp[]>([]);
  const [selectedLocation, setSelectedLocationCheck] = useState(-1);
  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await API.get(
          "/request_procurement/barangay_evac_list",
        );
        setLocationList(response.data);
      } catch (e: any) {
        console.error(
          "Error fetching barangay and Evacuation list: " + e.message,
        );
      }
    };
    fetch();
  }, []);
  const handleSubmit = () => {
    const selectedItem = locationList[selectedLocation];
    setSelectedLocation(selectedItem.id, selectedItem.name, selectedItem.type);
    onClose();
  };
  return (
    <ModalOverlay
      onClose={onClose}
      onSubmit={handleSubmit}
      modalType="submit"
      zIndex={1000}
    >
      <div className="modal-content">
        <h3>Select Barangay/Evacuation</h3>
        {locationList && (
          <div style={{ width: "100%" }}>
            <table style={{ width: "100%" }}>
              <thead
                style={{
                  textAlign: "start",
                  padding: "10px",
                  backgroundColor: "#749ab6",
                  color: "white",
                }}
              >
                <tr>
                  <th>{"  "}</th>
                  <th style={{ textAlign: "start", padding: "10px" }}>Name</th>
                  <th style={{ textAlign: "start", padding: "10px" }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {locationList.map((item, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor:
                        selectedLocation === index ? "#e3f2fd" : "transparent",
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLocation === index}
                        onChange={() => setSelectedLocationCheck(index)}
                      />
                    </td>
                    <td style={{ padding: "10px" }}>{item.name}</td>
                    <td style={{ padding: "10px" }}>{item.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
};
