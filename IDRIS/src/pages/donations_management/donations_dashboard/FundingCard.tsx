import styles from "./fundingcard.module.scss";
import { Link, useNavigate } from "react-router-dom";
import { useUserRoleContext } from "../../../UserRoleContext";

const backendUrl = "http://127.0.0.1:8000";

type FundingProps = {
  image?: string;
  message?: string;
  donated?: number;
  target?: number;
  anchorLink?: number | string;
  funding_id: number; // Funding ID for Donate
  className?: string;
};

export const FundingCard: React.FC<FundingProps> = ({
  image,
  message,
  donated,
  target,
  anchorLink,
  funding_id,
  className = "",
}) => {
  const navigate = useNavigate();

  const { userRoles } = useUserRoleContext();
  const filled = Math.round(Math.min(((donated ?? 0) / (target ?? 1)) * 100, 100));
  const handleDonateButton = (fundingId: number) => {
    navigate("/donations_management/funding_donation", {state: {funding_id: fundingId} });
  }

  return (
    <div className={`${styles.fundingCard} ${className}`}>
      <img src={`${backendUrl}/${image}`} alt="funding-image" />
      <p className={`${styles.fundingMessage}`}>{message}</p>
      <div className={styles["progress-container"]}>
        <div className={styles["full-bar"]}>
          <div
            className={styles["funded-bar"]}
            style={{ width: `${filled}%` }}
          ></div>
        </div>
        <p>{filled}% Raised</p>
      </div>
      {userRoles.includes("donor") && (
        // <Link
        //   to={`${anchorLink}`}
        //   className={styles["funding-donate-btn"]}
        // >
        //   Donate
        // </Link>
        <button className={styles["funding-donate-btn"]} 
          onClick={ () => { handleDonateButton(funding_id)}}
        > Donate </button>
      )}
    </div>
  );
};

