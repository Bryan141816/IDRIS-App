import styles from "./FundingCard.module.scss";
import { useNavigate } from "react-router-dom";
import { useUserRoleContext } from "../../../UserRoleContext";
import Image from '../../images/no-image.jpg';
import { formatCurrency } from "../helpers";

const backendUrl = "http://127.0.0.1:8000";

// Fallback placeholder image
const fallbackImage = Image;

type FundingProps = {
  image?: string;
  message?: string;
  donated?: number;
  target?: number;
  anchorLink?: number | string;
  funding_id: number; // Funding ID for Donate
  is_active?: boolean;
  className?: string;
  total_donated?: number;
};

export const FundingCard: React.FC<FundingProps> = ({
  image,
  message,
  donated,
  target,
  anchorLink,
  funding_id,
  is_active,
  className = "",
  total_donated,
}) => {
  const navigate = useNavigate();
  const { userRoles } = useUserRoleContext();

  const adminAccess = userRoles.includes("superadmin") || userRoles.includes("operations admin");

  const filled = Math.round(Math.min(((donated ?? 0) / (target ?? 1)) * 100, 100));

  const handleDonateButton = (fundingId: number) => {
    navigate("/donations_management/funding_donation", { state: { funding_id: fundingId } });
  };

  // Safely build image URL or use fallback
  const imageUrl =
    image && image.trim() !== "" ? `${backendUrl}/${image}` : fallbackImage;

  return (
    <div className={`${styles.fundingCard} ${className}`}>
      <img src={imageUrl} alt="funding-image" />
      <p className={styles.fundingMessage}>{message || "No description available."}</p>
      <div className={styles.statusIndicator}>
        {is_active ? (
          <span className={styles.active}>Active</span>
        ) : (
          <span className={styles.inactive}>Inactive</span>
        )}
      </div>
      {adminAccess &&
        <div className={styles["progress-container"]}>
          <p className={styles.amountRaised}>
            {formatCurrency(total_donated || 0)} raised of {formatCurrency(target || 0)}
          </p>
          <div className={styles["full-bar"]}>
            <div
              className={styles["funded-bar"]}
              style={{ width: `${filled}%` }}
            ></div>
          </div>
        </div>
      }
      {userRoles.includes("donor") && is_active && (
        <button
          className={styles["funding-donate-btn"]}
          onClick={() => handleDonateButton(funding_id)}
        >
          Donate
        </button>
      )}
    </div>
  );
};
