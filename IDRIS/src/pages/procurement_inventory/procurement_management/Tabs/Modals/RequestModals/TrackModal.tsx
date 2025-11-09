import { ModalOverlay } from "../ProcurementModalsDefault";
import { ProcurementRequest } from "../ProcurementDefaults";
import React, { useState } from "react";
import { Stepper } from "react-form-stepper";
interface TrackDeliveryProp {
  onClose: () => void;
  selectedData: ProcurementRequest;
}
function formatShortDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
export const TrackDelivery: React.FC<TrackDeliveryProp> = ({
  onClose,
  selectedData,
}) => {
  function getProgress(status: string) {
    let step = 0;
    switch (status.toLowerCase()) {
      case "waiting for additional action":
        step = 0;
        break;
      case "waiting for volunteer acceptance":
        step = 1;
        break;
      case "active":
        step = 2;
        break;
      case "in transit":
        step = 3;
        break;
      case "completed":
        step = 4;
        break;
    }
    return step;
  }
  return (
    <ModalOverlay onClose={onClose} modalType="view">
      <div className="modal-content">
        <h3>Track Delivery</h3>

        <Stepper
          steps={[
            { label: "Route Created" },
            { label: "Awaiting Volunteer Approval" },
            { label: "Ready for Transit" },
            { label: "In Transit" },
            { label: "Completed" },
          ]}
          activeStep={getProgress(selectedData.route.status)}
          styleConfig={{
            activeBgColor: "#007bff",
            activeTextColor: "#ffffff",
            completedBgColor: "#28a745",
            completedTextColor: "#ffffff",
            inactiveBgColor: "#e0e0e0",
            inactiveTextColor: "#888888",
            size: "3em",
            circleFontSize: "1.2rem",
            labelFontSize: "0.9rem",
            borderRadius: "50%",
            fontWeight: "500",
          }}
          connectorStyleConfig={{
            activeColor: "#007bff",
            completedColor: "#28a745",
            disabledColor: "#ccc",
            size: 5,
            style: "solid",
          }}
        />
        <div
          className="form-group"
          style={{
            display: "flex",
            paddingLeft: "5%",
            paddingRight: "5%",
            flexDirection: "column",
          }}
        >
          <strong>Logs</strong>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            {selectedData.route.logs.map((item, index) => (
              <div
                key={item.log_id}
                style={{
                  display: "flex",
                  padding: "5px 0px",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    width: "10%",
                    color: index === 0 ? "black" : "gray",
                  }}
                >
                  {formatShortDate(item.date ?? "")}
                </span>
                <span
                  style={{
                    color: index === 0 ? "#28a745" : "gray",
                  }}
                >
                  ●
                </span>
                <span
                  style={{
                    color: index === 0 ? "#28a745" : "gray",
                  }}
                >
                  {item.log_message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};
