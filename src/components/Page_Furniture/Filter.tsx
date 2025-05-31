import styles from './styles/filter.module.scss';

type FilterProp = {
  items?: string[];
  value?: string;
  onChange: (value: string) => void;
  width?: string;  // e.g., "100%", "200px"
  height?: string; // e.g., "40px"
  className?: string;
};

const FilterBar: React.FC<FilterProp> = ({
  items = [],
  value,
  onChange,
  width = '100%',
  height = '100%',
  className = "",
}) => {
  return (
    <div
      className={styles.filterContainer}
      style={{ width, height }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.filterSelect}
        style={{ width: '100%', height: '100%' }}
      >
        <option value="">Default</option>
        {items.map((item, index) => (
          <option key={index} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterBar;
