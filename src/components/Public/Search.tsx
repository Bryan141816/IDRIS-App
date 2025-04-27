import styles from './styles/search.module.scss';
import {SearchIcon} from '../../components/Icons';


type SearchProps = {
    placeholder?: string;
    value?: string;
    onChange: (value: string) => void; 
}

const SearchBar: React.FC<SearchProps> = ({ placeholder, value, onChange }) => {
  return (
    <>
    <div className={styles.searchContainer}>
        <input
        type="text"
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.searchInput}
        />

        <div className={styles.searchBox}>
            <SearchIcon width={14} height={14} />
        </div>
    </div>

    <div className={styles.filterContainer}>

    </div>
    </>
  );
};

export default SearchBar;
