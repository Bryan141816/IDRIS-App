import styles from './donation_record.module.scss';

type RecordProps = {
  donor?: string;
  amount?: number | string;
  site?: string;
  date?: Date;
  className?: string;
}

export const DonationRecord: React.FC<RecordProps> = ({
  donor, 
  amount, 
  site, 
  date,
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
      <p className="info">{donor} donated PHP {amount} to {site}</p>
      <p className="date">{formattedDate}</p>
    </div>
  )
}