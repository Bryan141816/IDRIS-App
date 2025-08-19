import { RefreshCircle } from './Icons';

const DonorStatusButton = ({
  isFirstMode = true,
  onToggle = () => {},
  firstLabel = "Mode A",
  secondLabel = "Mode B",
  className = "",
  id = ""
}) => {
  return (
    <button
      type="button"
      id="donor-status-button"
      onClick={onToggle}
      className={` ${className}`}
    >
      {isFirstMode ? firstLabel : secondLabel}

      <RefreshCircle
        width={24}
        height={24}
        className={isFirstMode ? "rotation-icon" : "rotation-icon-reverse"}
      />
    </button>
  );
};

export default DonorStatusButton;
