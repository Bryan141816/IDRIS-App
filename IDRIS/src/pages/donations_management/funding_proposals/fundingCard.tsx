import styles from "./FundingCard.module.scss";
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
  is_active?: boolean;
};

const FundingCard: React.FC<FundingProp> = ({
  proposalId,
  title = "Title",
  image,
  description,
  donated = 0,
  target = 100,
  starting_date,
  end_date,
  is_active,
}) => {
  const fundingData = { proposalId, title, image, description, target, starting_date, end_date, is_active };

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

  const goToUpdatePage = () => {
    navigate("/donations_management/funding_proposals/update", { state: fundingData });
  };

  const handleDonateButton = (fundingId: number) => {
    navigate("/donations_management/funding_donation", { state: { funding_id: fundingId } });
  };

  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return { text: "No end date", value: null };
    const endDate = new Date(endDateStr);
    const now = new Date();
    if (endDate < now) return { text: "Ended", value: 0 };
    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { text: `${diffDays} days remaining`, value: diffDays };
  };

  const { text: daysRemainingText, value: daysRemainingValue } = getDaysRemaining(end_date);

  const percentage = Math.round(
    getTimeRemainingPercent(starting_date ?? new Date(), end_date ?? new Date())
  );
  const atStart = is_active && Math.round(percentage) === 100;

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
        <div className={styles.daysRemainingContainer}>
          <p>{daysRemainingText}</p>
          <p className={styles.statusIndicator}>
            { atStart ? (
              <span className={styles.not_started}>Not Started</span>
            ) : is_active ? (
              <span className={styles.active}>Active</span>
            ) : (
              <span className={styles.inactive}>Inactive</span>
            )}
          </p>
        </div>
        <div className={styles.progressBarContainer}>
          <div
            className={`${styles.progressBar} ${ atStart ? styles.progressBar__notStarted : ""}`}
            style={{ width: `${percentage}%` }}
            title={`${starting_date} to ${end_date}`}
            aria-label={`${starting_date} to ${end_date}`}
          />
        </div>
        {userRoles.includes("donor") && proposalId != null && is_active && !atStart && (
          <button className={styles.donateButton} onClick={() => handleDonateButton(proposalId)}>
            Donate
          </button>
        )}
      </div>
    </div>
  );
};

export default FundingCard;

type DateInput = Date | string | number;

export function getTimeRemainingPercent(
  start: DateInput,
  end: DateInput,
  now: DateInput = new Date()
): number {
  const elapsed = getTimeProgressPercent(start, end, now);
  return Math.max(0, Math.min(100, 100 - elapsed));
}


export function getTimeProgressPercent(
  start: DateInput,
  end: DateInput,
  now: DateInput = new Date(),
  reverse = false // when true → percent remaining
): number {
  const s = toDate(start);
  const e = toDate(end);
  const n = toDate(now);

  if (!isValidDate(s) || !isValidDate(e) || !isValidDate(n)) return 0;

  const totalMs = e.getTime() - s.getTime();
  if (totalMs <= 0) return reverse ? 0 : (n.getTime() >= e.getTime() ? 100 : 0);

  if (n <= s) return reverse ? 100 : 0;
  if (n >= e) return reverse ? 0 : 100;

  const elapsed = ((n.getTime() - s.getTime()) / totalMs) * 100;
  const val = reverse ? 100 - elapsed : elapsed;
  return Math.max(0, Math.min(100, val));
}

/** Robust-ish parser for common inputs */
function toDate(input: DateInput): Date {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === "number") return new Date(input);
  if (typeof input === "string") {
    // Normalize plain "YYYY-MM-DD" to midnight local time to avoid UTC shifts.
    // If you prefer UTC, change to `${input}T00:00:00Z`.
    const isoDayOnly = /^\d{4}-\d{2}-\d{2}$/;
    return isoDayOnly.test(input) ? new Date(`${input}T00:00:00`) : new Date(input);
  }
  return new Date(NaN);
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

