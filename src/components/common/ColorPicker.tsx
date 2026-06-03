import { useEffect, useRef, useState } from 'react';
import styles from './ColorPicker.module.css';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#a855f7',
];

// Determines whether black or white text is more readable on a given hex background
function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

interface Props {
  currentColor: string | null;
  onSelect: (color: string | null) => void;
}

export function ColorPicker({ currentColor, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(currentColor ?? '');
  const [hexError, setHexError] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function openPicker(e: React.MouseEvent) {
    e.stopPropagation();
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      left: rect.left,
    });
    setIsOpen(v => !v);
  }

  function handlePresetClick(color: string) {
    onSelect(color);
    setHexInput(color);
    setHexError(false);
    setIsOpen(false);
  }

  function handleClear() {
    onSelect(null);
    setHexInput('');
    setHexError(false);
    setIsOpen(false);
  }

  function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value;
    if (val !== '' && !val.startsWith('#')) val = '#' + val;
    setHexInput(val);
    setHexError(false);
  }

  function handleHexApply() {
    const isValid = /^#([A-Fa-f0-9]{6})$/.test(hexInput);
    if (!isValid) { setHexError(true); return; }
    onSelect(hexInput);
    setIsOpen(false);
  }

  function handleHexKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleHexApply();
    if (e.key === 'Escape') setIsOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={openPicker}
        title="Set column color"
        type="button"
      >
        <span
          className={styles.swatch}
          style={{ background: currentColor ?? 'rgba(255,255,255,0.15)' }}
        />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={styles.popover}
          style={{ top: popoverPos.top, left: popoverPos.left }}
          onClick={e => e.stopPropagation()}
        >
          <p className={styles.label}>Column color</p>

          <div className={styles.presets}>
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                className={`${styles.preset} ${currentColor === color ? styles.selected : ''}`}
                style={{ background: color }}
                onClick={() => handlePresetClick(color)}
                type="button"
                title={color}
              />
            ))}
          </div>

          <div className={styles.customRow}>
            <div
              className={styles.hexPreview}
              style={{
                background: /^#([A-Fa-f0-9]{6})$/.test(hexInput)
                  ? hexInput
                  : 'rgba(255,255,255,0.1)',
              }}
            />
            <input
              className={`${styles.hexInput} ${hexError ? styles.hexError : ''}`}
              type="text"
              placeholder="#6366f1"
              value={hexInput}
              onChange={handleHexChange}
              onKeyDown={handleHexKeyDown}
              maxLength={7}
              spellCheck={false}
            />
            <button className={styles.applyBtn} onClick={handleHexApply} type="button">
              Apply
            </button>
          </div>
          {hexError && <p className={styles.errorMsg}>Enter a valid hex color</p>}

          {currentColor && (
            <button className={styles.clearBtn} onClick={handleClear} type="button">
              Remove color
            </button>
          )}
        </div>
      )}
    </>
  );
}

export { getContrastColor };

