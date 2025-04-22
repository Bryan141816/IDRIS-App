import styles from './fundingcard.module.scss';
import { Link } from 'react-router-dom';

type FundingProps = {
    image?: string;
    message?: string;
    funded?: number;
    target?: number;
    anchorLink?: string;
    className?: string;
}

export const FundingCard: React.FC<FundingProps> = ({
    image,
    message,
    funded,
    target,
    anchorLink,
    className = ""
}) => {
    const filled = Math.min(((funded ?? 0) / (target ?? 1)) * 100, 100);

    return(
        <div className={`${styles.fundingCard} ${className}`}>
            <img src={image} alt="funding-image" />
            <p>{message}</p>
            <div className={styles["progress-container"]}>
                <div className={styles["full-bar"]}>
                    <div className={styles["funded-bar"]} style={{ width: `${filled}%` }}></div>
                </div>
                <p>Raised</p>
            </div>            
            <Link to={`/donate/${anchorLink}`} className={styles['funding-donate-btn']}>Donate</Link>
        </div>
    )
}