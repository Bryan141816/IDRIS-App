import styles from "./fundingCard.module.scss";
import defaultFundingImage from "../files/default_image.jpg";
import { CircleDot } from "../../../components/Page_Furniture/Icons";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRoleContext } from "../../../UserRoleContext";
import { useUserContext } from "../../../UserContext";
import { formatCurrency } from "../helpers";
import Swal from "sweetalert2";

const backendUrl = "http://127.0.0.1:8000";

type FundingProp = {
  proposalId?: number;
  title?: string;
  image?: string;
  description?: string;
  donated?: number;
  target?: number;
  starting_date?: string;
  end_date?: string;
};

const FundingCard: React.FC<FundingProp> = ({
  proposalId,
  title = "Title",
  image,
  description,
  donated = 0,
  target = 100,
}) => {
  const fundingData = { proposalId, title, image, description, target };

  const { userType } = useUserContext();
  const { userRoles } = useUserRoleContext();
  const navigate = useNavigate();

  const [activeStatus, setActive] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleActive = () => setActive((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build a safe image URL
  const buildImageUrl = (img?: string) => {
    if (!img || img.trim() === "") return defaultFundingImage;
    const lower = img.toLowerCase();
    if (
      lower.startsWith("http://") ||
      lower.startsWith("https://") ||
      lower.startsWith("data:") ||
      lower.startsWith("blob:")
    ) return img;
    if (lower.startsWith("/") || lower.startsWith(".")) return img; // local/static path
    return `${backendUrl}/${img.replace(/^\/+/, "")}`;
  };

  const [imgSrc, setImgSrc] = useState<string>(() => buildImageUrl(image));
  useEffect(() => { setImgSrc(buildImageUrl(image)); }, [image]);

  const percentage = Math.round(getPercentage(donated, target));

  const goToUpdatePage = () => {
    navigate("/donations_management/funding_proposals/update", { state: fundingData });
  };

  const handleDonateButton = (fundingId: number) => {
    navigate("/donations_management/funding_donation", { state: { funding_id: fundingId } });
  };

  return (
    <div className={styles.fundingCard}>
      {/* HEADER */}
      <div className={styles.fundingHead}>
        <p className={styles.title}>{title}</p>
        <div className={styles.menuContainer} ref={menuRef}>
          {(userRoles.includes("superadmin") || userRoles.includes("operations admin")) && (
            <div className={styles.iconsContainer} onClick={toggleActive}>
              <CircleDot width={14} height={14} />
              <CircleDot width={14} height={14} />
              <CircleDot width={14} height={14} />
            </div>
          )}
          <div className={`${styles.menuItems} ${activeStatus ? styles.active : ""}`.trim()}>
            <button onClick={goToUpdatePage}>Edit</button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className={styles.fundingBody}>
        <p className={styles.description}>{description || "No description available."}</p>
        <img
          src={imgSrc}
          alt={title || "funding image"}
          className={styles.image}
          onError={() => setImgSrc(defaultFundingImage)}
        />
      </div>

      {/* FOOTER */}
      <div className={styles.fundingFooter}>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className={styles.progressContainer}>
          <p className={styles.progress}>
            {formatCurrency(donated)}
          </p>
          <p className={styles.percentage}>{percentage}%</p>
        </div>

        {userRoles.includes("donor") && proposalId != null && (
          <button className={styles.donateButton} onClick={() => handleDonateButton(proposalId)}>
            Donate
          </button>
        )}
      </div>
    </div>
  );
};

export default FundingCard;

function getPercentage(current: number, target: number) {
  if (!target) return 0;
  return (current / target) * 100;
}
