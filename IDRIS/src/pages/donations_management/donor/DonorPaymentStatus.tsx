import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { 
  getPayMongoSession, 
  completeDonation, 
  failDonation,
  cancelDonation
} from "../../../API_Handler/donations_donation_handler";

interface DonorPaymentStatusProps {
  donationId: string;
  checkoutSessionId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const DonorPaymentStatus: React.FC<DonorPaymentStatusProps> = ({ 
  donationId, 
  checkoutSessionId,
  onSuccess,
  onClose
}) => {
  const [showPendingCard, setShowPendingCard] = useState<boolean>(false);
  const cancelledRef = useRef<boolean>(false);

  useEffect(() => {
    cancelledRef.current = false;
    let mounted = true;
    const POLL_INTERVAL_MS = 2000; // 2 seconds between attempts
    const VERIFICATION_DURATION_MS = 180000; // 3 minutes

    function sleep(ms: number) {
      return new Promise((res) => setTimeout(res, ms));
    }

    async function verifyPayment() {
      if (!mounted || cancelledRef.current) return;

      Swal.fire({
        title: "Verifying payment",
        text: "Checking payment status...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Use the provided checkoutSessionId prop instead of searching URL/localStorage
      const sessionId = checkoutSessionId;

      if (!sessionId) {
        Swal.close();
        onClose();
        return;
      }

      setShowPendingCard(true);

      try {
        const startTime = Date.now();
        let finalResult: "success" | "pending" | "failed" | "cancelled" | "unknown" = "unknown";

        while (mounted && Date.now() - startTime < VERIFICATION_DURATION_MS) {
          if (cancelledRef.current) {
            break;
          }
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
          
          if (["failed"].includes(sessionStatus) || ["failed"].includes(paymentStatus)) {
            finalResult = "failed";
            break;
          }

          if (["expired", "canceled", "cancelled"].includes(sessionStatus) ||
              ["canceled", "cancelled", "expired"].includes(paymentStatus)) {
            finalResult = "cancelled";
            break;
          }

          // Otherwise, it's still pending, so we wait and loop again
          finalResult = "pending";
          await sleep(POLL_INTERVAL_MS);
        }

        // Clean up localStorage just in case it was set elsewhere
        localStorage.removeItem("paymongo_session_id");

        if (cancelledRef.current) {
          Swal.close();
          setShowPendingCard(false);
          onClose();
          return;
        }

        if (finalResult === "success") {
          Swal.hideLoading();
          setShowPendingCard(false);
          
          // Update donation status to completed
          if (donationId) {
            try {
              await completeDonation(donationId);
              // Show success message then trigger callback
              await Swal.fire({
                icon: "success",
                title: "Donation Successful!",
                text: "Thank you!",
                showConfirmButton: true,
                allowOutsideClick: true,
              });
              onSuccess();
            } catch (error) {
              console.error("Failed to update donation status to completed:", error);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "Payment successful but failed to update record. Please contact support.",
              });
            }
          }
          
        } else if (finalResult === "pending") {
          Swal.hideLoading();
          setShowPendingCard(false);
          await Swal.fire({
            icon: "info",
            title: "Payment Pending",
            text: "Your payment is pending. If it doesn't complete, please check your donation history later.",
            showConfirmButton: true,
            allowOutsideClick: true,
          });
        } else if (finalResult === "failed") {
          Swal.hideLoading();
          setShowPendingCard(false);
          
          // Update donation status to failed
          if (donationId) {
            try {
              await failDonation(donationId);
            } catch (error) {
              console.error("Failed to update donation status to failed:", error);
            }
          }

          await Swal.fire({
            icon: "error",
            title: "Donation Failed",
            text: "Payment failed. Please try again.",
            showConfirmButton: true,
            allowOutsideClick: true,
          });
        } else if (finalResult === "cancelled") {
          Swal.hideLoading();
          setShowPendingCard(false);
          
          // Update donation status to cancelled
          if (donationId) {
            try {
              await cancelDonation(donationId);
            } catch (error) {
              console.error("Failed to update donation status to cancelled:", error);
            }
          }

          await Swal.fire({
            icon: "info",
            title: "Donation Cancelled",
            text: "Payment was cancelled or expired. Please try again if you wish to donate.",
            showConfirmButton: true,
            allowOutsideClick: true,
          });
        } else {
          Swal.hideLoading();
          setShowPendingCard(false);
          await Swal.fire({
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
        await Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: "Could not verify payment. Please check your donation history later.",
          showConfirmButton: true,
          allowOutsideClick: true,
        });
      } finally {
        onClose(); // Ensure we clean up the parent state
      }
    }

    const timer = setTimeout(() => verifyPayment(), 500);

    return () => {
      mounted = false;
      cancelledRef.current = true;
      clearTimeout(timer);
      setShowPendingCard(false);
    };
  }, [donationId, checkoutSessionId]);

  const handleCancel = async () => {
    cancelledRef.current = true;
    setShowPendingCard(false);
    Swal.close();
    if (donationId) {
      try {
        await cancelDonation(donationId);
      } catch (err) {
        console.error("Failed to cancel donation from timer UI:", err);
      }
    }
    onClose();
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
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>Processing payment...</div>
          <div style={{ marginBottom: "10px", color: "#4b5563" }}>
            We're waiting for PayMongo to confirm. You can cancel if you no longer wish to continue.
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

export default DonorPaymentStatus;
