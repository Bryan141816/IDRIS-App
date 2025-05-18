import styles from './styles/filter.module.scss';

type FilterProp = {
    items?: string[];
    value?: string;
    onChange: (value: string) => void;
}

const FilterBar: React.FC<FilterProp> = ({ items = [], value, onChange }) => {
return (
    <div className={styles.filterContainer}>
        <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.filterSelect}
        >
        <option value="">Default</option> {/* Default "empty" option */}
        {items.map((item, index) => (
            <option key={index} value={item}>
            {item}
            </option>
        ))}
        </select>
    </div>
    );}

export default FilterBar