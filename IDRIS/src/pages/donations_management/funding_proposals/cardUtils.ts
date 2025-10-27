import styles from "./FundingCard.module.scss";

export const getDaysRemaining = (startDateStr?: string, endDateStr?: string) => {
  if (!endDateStr) return { text: "No end date", value: null, percentage: 100 };
  const endDate = new Date(endDateStr);
  const now = new Date();
  if (endDate < now) return { text: "Ended", value: 0, percentage: 0 };
  const diffTime = Math.abs(endDate.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const startDate = new Date(startDateStr || now);
  const totalDuration = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const percentage = totalDuration > 0 ? (diffDays / totalDuration) * 100 : 0;

  return { text: `${diffDays} days remaining`, value: diffDays, percentage };
};

export const getCardClass = (percentage: number | null) => {
  if (percentage === null) return '';
  if (percentage > 50) return styles.safe;
  if (percentage >= 25) return styles.warning;
  return styles.danger;
};
