import styles from './DonationRecord.module.scss';

type RecordProps = {
  donor_name?: string;
  amount?: number | string;
  funding_title?: string;
  donation_date?: Date;
  donation_type?: string;
  item_description?: string;
  className?: string;
}

export const DonationRecord: React.FC<RecordProps> = ({
  donor_name,
  amount,
  funding_title,
  donation_date,
  donation_type,
  item_description,
  className = ""
}) => {
  const formattedDate = donation_date
    ? donation_date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not available";

  const safeDonor = donor_name?.trim() || "Anonymous Donor";
  const safeFunding = funding_title?.trim() || "General Fund";
  const safeDescription = item_description?.trim().toLowerCase() || "no description";
  const safeAmount =
    formatAmount(amount) ||
    (donation_type === "inkind" ? "unspecified value" : "unspecified amount");

  return (
    <div className={`${styles.donationRecord} ${className}`}>
      {donation_type === "inkind" ? (
        <p className={styles.info}>
          {safeDonor} donated <strong>in-kind</strong> items ({safeDescription}) worth{" "}
          {safeAmount} to {safeFunding}
        </p>
      ) : (
        <p className={styles.info}>
          {safeDonor} donated PHP {safeAmount} to {safeFunding}
        </p>
      )}
      <p className={styles.date}>{formattedDate}</p>
    </div>
  );
};

function formatAmount(amount?: number | string): string {
  if (amount === undefined || amount === null) return '';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  return num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
