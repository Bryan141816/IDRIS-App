import styles from './donation_record.module.scss';

type RecordProps = {
  donor?: string;
  amount?: number | string;
  site?: string;
  date?: Date;
  kind?: string;
  description?: string;
  className?: string;
}

export const DonationRecord: React.FC<RecordProps> = ({
  donor,
  amount,
  site,
  date,
  kind,
  description,
  className = ""
}) => {
  const formattedDate = date
    ? date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "";

  return (
    <div className={`${styles.donationRecord} ${className}`}>
      {kind === "inkind" ? (
        <p className={styles.info}>
          {donor} donated <strong>in-kind</strong> items ({description?.toLowerCase() || "no description"}) worth {amount} to {site}
        </p>
      ) : (
        <p className={styles.info}>
          {donor} donated PHP {formatAmount(amount)} to {site}
        </p>
      )}
      <p className={styles.date}>{formattedDate}</p>
    </div>
  )
}

function formatAmount(amount?: number | string): string {
  if (amount === undefined || amount === null) return '';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  return num.toLocaleString();
}