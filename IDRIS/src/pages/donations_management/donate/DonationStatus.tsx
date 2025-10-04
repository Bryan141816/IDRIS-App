import React, { useEffect } from "react";
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
    const MAX_ATTEMPTS = 90; // 90 * 2s = 180s = 3 minutes

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

      try {
        let attempt = 0;
        let finalResult: "success" | "pending" | "failed" | "unknown" = "unknown";

        while (mounted && attempt < MAX_ATTEMPTS) {
          attempt += 1;

          // Calculate and display time remaining
          const totalMs = MAX_ATTEMPTS * POLL_INTERVAL_MS;
          const elapsedMs = attempt * POLL_INTERVAL_MS;
          const remainingMs = Math.max(0, totalMs - elapsedMs);
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
            if (attempt < MAX_ATTEMPTS) await sleep(POLL_INTERVAL_MS);
            continue;
          }

          const session = resp?.data?.data?.attributes;

          if (!session) {
            if (attempt < MAX_ATTEMPTS) {
              await sleep(POLL_INTERVAL_MS);
              continue;
            } else {
              finalResult = "unknown";
              break;
            }
          }

          const sessionStatus = session.status;
          const paymentStatus = session.payments?.[0]?.attributes?.status;

          if (sessionStatus === "succeeded" || paymentStatus === "paid") {
            finalResult = "success";
            break;
          }

          if (paymentStatus === "pending" || sessionStatus === "pending" || sessionStatus === "processing") {
            finalResult = "pending";
            if (attempt < MAX_ATTEMPTS) {
              await sleep(POLL_INTERVAL_MS);
              continue;
            } else {
              break;
            }
          }

          if (
            ["failed", "expired", "canceled", "cancelled"].includes(sessionStatus) ||
            ["failed", "canceled", "cancelled", "expired"].includes(paymentStatus)
          ) {
            finalResult = "failed";
            break;
          }

          if (attempt < MAX_ATTEMPTS) {
            await sleep(POLL_INTERVAL_MS);
          }
        }

        localStorage.removeItem("paymongo_session_id");

        if (finalResult === "success") {
          Swal.hideLoading();
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
          Swal.update({
            icon: "info",
            title: "Payment Pending",
            text: "Your payment is pending. If it doesn't complete, please check your donation history later.",
            showConfirmButton: true,
            allowOutsideClick: true,
          });
        } else if (finalResult === "failed") {
          Swal.hideLoading();
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
    };
  }, [location, _donationId]);

  return <></>;
};

export default DonationStatus;