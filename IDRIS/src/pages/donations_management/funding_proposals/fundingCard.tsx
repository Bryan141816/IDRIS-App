import styles from './fundingCard.module.scss';
import defaultFundingImage from '../files/default_image.jpg';
import { CircleDot } from '../../../components/Page_Furniture/Icons';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRoleContext } from '../../../UserRoleContext';
import { useUserContext } from '../../../UserContext';

type FundingProp = {
    proposalId?: number;
    title?: string;
    image?: string; // link to image
    description?: string;
    donated?: number;
    target?: number;
}

const FundingCard: React.FC<FundingProp> = ({ 
    proposalId,
    title = "Title", 
    image = defaultFundingImage, 
    description, 
    donated = 0, 
    target = 100
}) => {
    const fundingData = { // Used to send data to the "Update Button". Avoid requerying the database
        proposalId,
        title,
        image,
        description,
        target,
    }

    const { userType } = useUserContext();
    const { userRole } = useUserRoleContext();
    const navigate = useNavigate();

    const [activeStatus, setActive] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleActive = () => {
        setActive(prev => !prev);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setActive(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const percentage = Math.round(getPercentage(donated, target));
    
    const goToUpdatePage = () => {
        navigate('/donations_management/funding_proposals/update', { state: fundingData });
      };

    return (
        <div className={styles.fundingCard}>
            {/* FUNDING HEADER */}
            <div className={styles.fundingHead}>
                <p className={styles.title}>{title}</p>
                <div className={styles.menuContainer} ref={menuRef}>
                    {/* TRIPLE CIRLE ICONS */}
                    { userRole === "operations admin" && (<div className={`${styles.iconsContainer}`} onClick={toggleActive}>
                        <CircleDot width={14} height={14} />
                        <CircleDot width={14} height={14} />
                        <CircleDot width={14} height={14} />
                    </div>)}
                    <div className={`${styles.menuItems} ${activeStatus ? styles.active : ''}`.trim()}>
                        <button onClick={goToUpdatePage}>Edit</button>
                        {/* <button>Delete</button> */}
                    </div>
                </div>
            </div>
            
            {/* FUNDING BODY */}
            <div className={styles.fundingBody}>
                <p className={styles.description}>{description}</p>
                <img src={image} alt="funding_image" className={styles.image} />
            </div>

            {/* <hr className={styles.hLine} /> */}

            {/* FUNDING FOOTER */}
            <div className={styles.fundingFooter}>
                <div className={styles.progressContainer}>
                    <p className={styles.progress}>
                        <CircleDot width={16} height={16} className={styles.circleDot} />
                        PHP {donated} / {target}
                    </p>
                    <p className={styles.percentage}>{percentage}%</p>
                </div>

                { userType == "user" && <button className={styles.donateButton}>Donate</button> }
            </div>
        </div>
    );
};

export default FundingCard

function getPercentage(current: number, target: number) {
    if (target === 0) return 0; // Avoid division by zero
    return (current / target) * 100;
}
