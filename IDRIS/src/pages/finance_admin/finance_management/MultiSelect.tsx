import React, { useEffect, useRef, useState } from 'react';
import './MultiSelect.scss';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  isDisabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, isDisabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const handleToggle = () => {
    if (!isDisabled) setIsOpen(prev => !prev);
  };

  const handleSelect = (value: string) => {
    if (isDisabled) return;
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  // Close on outside click/touch
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // If it becomes disabled while open, close it
  useEffect(() => {
    if (isDisabled && isOpen) setIsOpen(false);
  }, [isDisabled, isOpen]);

  return (
    <div className="multi-select" ref={rootRef}>
      <div
        className={`select-header ${isOpen ? 'open' : ''} ${isDisabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={isDisabled || false}
        tabIndex={isDisabled ? -1 : 0}
        onKeyDown={(e) => {
          if (isDisabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(prev => !prev);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        {selected.length > 0 ? selected.join(', ') : 'Select...'}
      </div>
      {isOpen && (
        <div className="options-container" role="listbox" aria-multiselectable="true">
          <button
            type="button"
            className="option"
            onClick={() => onChange(selected.length === options.length ? [] : options.map(o => o.value))}
          >
            {selected.length === options.length ? 'Clear all' : 'Select all'}
          </button>
          {options.map(option => (
            <label key={option.value} className="option">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => handleSelect(option.value)}
                disabled={isDisabled}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
