import styles from './donation_record.module.scss';

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
    : "";

  return (
    <div className={`${styles.donationRecord} ${className}`}>
      {donation_type === "inkind" ? (
        <p className={styles.info}>
          {donor_name} donated <strong>in-kind</strong> items ({item_description?.toLowerCase() || "no description"}) worth {amount} to {funding_title}
        </p>
      ) : (
        <p className={styles.info}>
          {donor_name} donated PHP {formatAmount(amount)} to {funding_title}
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