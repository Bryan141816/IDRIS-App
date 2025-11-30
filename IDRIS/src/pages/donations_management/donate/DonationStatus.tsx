import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  getPayMongoSession, 
  completeDonation, 
  failDonation, 
  cancelDonation 
} from "../../../API_Handler/donations_donation_handler";

interface DonationStatusProps {
  _donationId?: string;
}

export const DonationStatus: React.FC<DonationStatusProps> = ({ _donationId }) => {
  const [showPendingCard, setShowPendingCard] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  console.log("received donation id:", _donationId);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");

    // If explicit status query param is present (existing behavior)
    if (status === "success") {
      Swal.fire({
        icon: "success",
        title: "Donation Successful!",
        text: "Thank you for your generous donation.",
      }).then(() => {
        console.log("Updating success donation id: ", _donationId);
        if (_donationId) {
          completeDonation(_donationId).catch(console.error);
        }
      });
      return;
    } else if (status === "failed") {
      console.log("Updating failed donation id: ", _donationId);
      Swal.fire({
        icon: "error",
        title: "Donation Failed",
        text: "Something went wrong with your donation. Please try again.",
      }).then(() => {
        if (_donationId) {
          failDonation(_donationId).catch(console.error);
        }
      });
      return;
    }

    let mounted = true;
    const POLL_INTERVAL_MS = 2000; // 2 seconds between attempts
    const VERIFICATION_DURATION_MS = 180000; // 3 minutes

    function sleep(ms: number) {
      return new Promise((res) => setTimeout(res, ms));
    }

    async function verifyPayment() {
      if (!mounted) return;

      Swal.fire({
        title: "Verifying payment",
        text: "Checking payment status...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const sessionIdFromQuery = params.get("checkout_session_id");
      const sessionId = sessionIdFromQuery || localStorage.getItem("paymongo_session_id");

      if (!sessionId) {
        Swal.close();
        return;
      }

      setShowPendingCard(true);

      try {
        const startTime = Date.now();
        let finalResult: "success" | "pending" | "failed" | "unknown" = "unknown";

        while (mounted && Date.now() - startTime < VERIFICATION_DURATION_MS) {
          const elapsedTime = Date.now() - startTime;
          const remainingMs = Math.max(0, VERIFICATION_DURATION_MS - elapsedTime);
          const remainingSeconds = Math.ceil(remainingMs / 1000);
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          const timeRemaining = `${mins}:${secs.toString().padStart(2, '0')}`;

          Swal.update({
            text: `Checking payment status... (${timeRemaining} remaining)`,
          });
          Swal.showLoading();

          let resp;
          try {
            resp = await getPayMongoSession(sessionId);
          } catch (err) {
            console.warn("getPayMongoSession failed, will retry:", err);
            await sleep(POLL_INTERVAL_MS);
            continue;
          }

          const session = resp?.data?.data?.attributes;
          if (!session) {
            await sleep(POLL_INTERVAL_MS);
            continue;
          }

          const sessionStatus = session.status;
          const paymentStatus = session.payments?.[0]?.attributes?.status;

          if (sessionStatus === "succeeded" || paymentStatus === "paid") {
            finalResult = "success";
            break; 
          }
          
          if (["failed", "expired", "canceled", "cancelled"].includes(sessionStatus) ||
              ["failed", "canceled", "cancelled", "expired"].includes(paymentStatus)) {
            finalResult = "failed";
            break;
          }

          // Otherwise, it's still pending, so we wait and loop again
          finalResult = "pending";
          await sleep(POLL_INTERVAL_MS);
        }

        localStorage.removeItem("paymongo_session_id");

        if (finalResult === "success") {
          Swal.hideLoading();
          setShowPendingCard(false);
          Swal.update({
            icon: "success",
            title: "Donation Successful!",
            text: "Thank you!",
            showConfirmButton: true,
            allowOutsideClick: true,
          });
          
          // Update donation status to completed
          if (_donationId) {
            try {
              console.log(_donationId);
              await completeDonation(_donationId);
            } catch (error) {
              console.error("Failed to update donation status to completed:", error);
            }
          }
          
          navigate("/donations_management/funding_proposals", { replace: true });
        } else if (finalResult === "pending") {
          Swal.hideLoading();
          setShowPendingCard(false);
          Swal.update({
            icon: "info",
            title: "Payment Pending",
            text: "Your payment is pending. If it doesn't complete, please check your donation history later.",
            showConfirmButton: true,
            allowOutsideClick: true,
          });
        } else if (finalResult === "failed") {
          Swal.hideLoading();
          setShowPendingCard(false);
          Swal.update({
            icon: "error",
            title: "Donation Not Completed",
            text: "Payment failed, expired or was cancelled. Please try again.",
            showConfirmButton: true,
            allowOutsideClick: true,
          });
          
          // Update donation status to failed
          if (_donationId) {
            try {
              await failDonation(_donationId);
            } catch (error) {
              console.error("Failed to update donation status to failed:", error);
            }
          }
        } else {
          Swal.hideLoading();
          setShowPendingCard(false);
          Swal.update({
            icon: "warning",
            title: "Verification Timed Out",
            text: "We couldn't confirm your payment status within 3 minutes. Please check your donation history later.",
            showConfirmButton: true,
            allowOutsideClick: true,
          });
        }
      } catch (err) {
        console.error("Payment verification failed:", err);
        Swal.hideLoading();
        setShowPendingCard(false);
        Swal.update({
          icon: "error",
          title: "Verification Failed",
          text: "Could not verify payment. Please check your donation history later.",
          showConfirmButton: true,
          allowOutsideClick: true,
        });
      }
    }

    const timer = setTimeout(() => verifyPayment(), 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
      setShowPendingCard(false);
    };
  }, [location, _donationId]);

  const handleCancel = async () => {
    setShowPendingCard(false);
    Swal.close();
    if (_donationId) {
      try {
        await failDonation(_donationId);
      } catch (err) {
        console.error("Failed to cancel donation from timer UI:", err);
      }
    }
  };

  return (
    <>
      {showPendingCard && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            padding: "12px 16px",
            zIndex: 2000,
            maxWidth: "320px",
            fontSize: "14px",
            color: "#111827",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>Processing payment…</div>
          <div style={{ marginBottom: "10px", color: "#4b5563" }}>
            We’re waiting for PayMongo to confirm. You can cancel if you no longer wish to continue.
          </div>
          <button
            onClick={handleCancel}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel Donation
          </button>
        </div>
      )}
    </>
  );
};

export default DonationStatus;
