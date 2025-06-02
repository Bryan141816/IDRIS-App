import styles from './fundingcard.module.scss';
import { Link } from 'react-router-dom';
import { useUserRoleContext } from '../../../UserRoleContext';
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

    const { userRole } = useUserRoleContext();

    const filled = Math.min(((funded ?? 0) / (target ?? 1)) * 100, 100);
    
    return(
        <div className={`${styles.fundingCard} ${className}`}>
            <img src={image} alt="funding-image" />
            <p className={`${styles.fundingMessage}`}>{message}</p>
            <div className={styles["progress-container"]}>
                <div className={styles["full-bar"]}>
                    <div className={styles["funded-bar"]} style={{ width: `${filled}%` }}></div>
                </div>
                <p>{filled}% Raised</p>
            </div>            
            { userRole === "donor" && <Link to={`/donate/${anchorLink}`} className={styles['funding-donate-btn']}>Donate</Link>}
        </div>
    )
}