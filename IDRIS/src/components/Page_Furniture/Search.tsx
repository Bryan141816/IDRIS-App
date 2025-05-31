import styles from './styles/search.module.scss';
import { SearchIcon } from './Icons';

// NOTE: This component will take 100% of parent width by default

type SearchProps = {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  width?: string;  // e.g., "100%", "300px"
  height?: string; // e.g., "40px", "2.5rem"
};

const SearchBar: React.FC<SearchProps> = ({
  placeholder,
  value,
  onChange,
  width = '100%',
  height = '40px',
}) => {
  return (
    <div
      className={styles.searchContainer}
      style={{ width, height }}
    >
      <input
        type="text"
        placeholder={placeholder || 'Search...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.searchInput}
        style={{ height: '100%' }}
      />
      <div className={styles.searchBox}>
        <SearchIcon width={14} height={14} />
      </div>
    </div>
  );
};

export default SearchBar;
