import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

/**
 * Komponen Select kustom Zero Burning
 * Menggantikan <select> native dengan panel opsi yang selaras dengan palet hangat/krem/hijau.
 *
 * Mendukung:
 * - Render via Portal ke document.body (bebas overflow: hidden pada card/tabel/modal)
 * - Auto flip (buka ke atas jika ruang bawah tidak mencukupi)
 * - Keyboard navigation (ArrowUp, ArrowDown, Home, End, Enter, Space, Escape, Tab, Typeahead)
 * - ARIA standard (combobox, listbox, option, aria-activedescendant)
 * - Varian ukuran: 'md' (default untuk form) dan 'sm' (untuk filter toolbar)
 * - Touch friendly (min-h 40px di desktop, min-h 44px di layar sentuh mobile)
 * - Searchable untuk daftar opsi panjang
 * - Label utama + deskripsi sekunder + ikon opsional
 */
export default function Select({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  disabled = false,
  error = false,
  size = 'md', // 'md' | 'sm'
  fullWidth = true,
  searchable = false,
  emptyMessage = 'Tidak ada opsi tersedia',
  searchPlaceholder = 'Cari...',
  className = '',
  name,
  id,
  required = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });

  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const typeaheadTimeoutRef = useRef(null);
  const typeaheadBufferRef = useRef('');

  // 1. Normalisasi opsi ke bentuk objek standar
  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value,
          label: opt.label !== undefined ? String(opt.label) : String(opt.value),
          description: opt.description,
          icon: opt.icon,
          disabled: Boolean(opt.disabled),
        };
      }
      return {
        value: opt,
        label: String(opt),
        description: undefined,
        icon: undefined,
        disabled: false,
      };
    });
  }, [options]);

  // 2. Filter opsi saat fitur pencarian aktif
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && String(opt.description).toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // 3. Menemukan opsi yang saat ini terpilih
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // 4. Kalkulasi posisi panel via floating fixed coordinates
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const estimatedHeight = Math.min(260, (filteredOptions.length || 1) * 44 + 60);
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    // Pastikan posisi horizontal tidak melewati batas layar
    const width = Math.max(rect.width, 160);
    let left = rect.left;
    if (left + width > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - width - 8);
    }
    if (left < 8) left = 8;

    setCoords({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      openUp,
    });
  }, [filteredOptions.length]);

  // 5. Buka / Tutup panel dropdown
  const openMenu = useCallback(() => {
    if (disabled) return;
    updatePosition();
    setIsOpen(true);
    setSearchQuery('');
    // Set highlight ke opsi terpilih atau opsi pertama
    const currentIndex = filteredOptions.findIndex((opt) => String(opt.value) === String(value));
    setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [disabled, filteredOptions, updatePosition, value]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [closeMenu, isOpen, openMenu]);

  // 6. Pilih salah satu opsi
  const handleSelect = useCallback(
    (opt) => {
      if (opt.disabled) return;
      if (typeof onChange === 'function') {
        onChange(opt.value);
      }
      closeMenu();
    },
    [closeMenu, onChange]
  );

  // 7. Update koordinat saat window di-scroll atau resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = (e) => {
      // Jika scroll terjadi di dalam panel dropdown itu sendiri, abaikan
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // 8. Menangani klik di luar dropdown (outside click)
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // 9. Auto fokus kolom pencarian jika searchable
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // 10. Auto scroll item yang ter-highlight ke dalam viewport list
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !listRef.current) return;
    const itemEl = listRef.current.children[highlightedIndex];
    if (itemEl && typeof itemEl.scrollIntoView === 'function') {
      itemEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // 11. Navigasi Keyboard
  const handleTriggerKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          openMenu();
        } else if (e.key === 'ArrowDown') {
          setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        } else if ((e.key === 'Enter' || e.key === ' ') && highlightedIndex >= 0) {
          const opt = filteredOptions[highlightedIndex];
          if (opt && !opt.disabled) handleSelect(opt);
        }
        break;

      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation(); // Cegah modal induk tertutup
          closeMenu();
        }
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;

      default:
        // Typeahead navigation (ketik karakter untuk melompat ke item)
        if (!isOpen && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          clearTimeout(typeaheadTimeoutRef.current);
          typeaheadBufferRef.current += e.key.toLowerCase();

          const match = normalizedOptions.find(
            (opt) => !opt.disabled && opt.label.toLowerCase().startsWith(typeaheadBufferRef.current)
          );

          if (match) {
            handleSelect(match);
          }

          typeaheadTimeoutRef.current = setTimeout(() => {
            typeaheadBufferRef.current = '';
          }, 500);
        }
        break;
    }
  };

  const handlePanelKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;

      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setHighlightedIndex(filteredOptions.length - 1);
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) handleSelect(opt);
        }
        break;

      case 'Escape':
        e.preventDefault();
        e.stopPropagation(); // Jangan tutup modal induk
        closeMenu();
        break;

      case 'Tab':
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  // Ukuran trigger
  const sizeClasses =
    size === 'sm'
      ? 'min-h-[40px] max-sm:min-h-[44px] py-2 px-3 text-xs'
      : 'min-h-[42px] max-sm:min-h-[44px] py-2.5 px-4 text-sm';

  const chevronSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const activeDescendantId =
    highlightedIndex >= 0 ? `${selectId}-option-${highlightedIndex}` : undefined;

  return (
    <div
      className={`relative inline-block ${fullWidth ? 'w-full' : ''} ${className}`}
      data-select-wrapper
    >
      {/* Input hidden untuk interoperabilitas form HTML standar */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value !== undefined && value !== null ? value : ''}
          required={required}
        />
      )}

      {/* Button Trigger */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendantId}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggleMenu}
        onKeyDown={handleTriggerKeyDown}
        className={`w-full flex items-center justify-between gap-2.5 border rounded-xl bg-card text-foreground transition-all duration-200 cursor-pointer select-none text-left focus:outline-none focus:ring-2 ${
          isOpen
            ? 'ring-2 ring-primary/20 border-primary shadow-xs'
            : 'border-input hover:border-primary/50'
        } ${
          error
            ? 'border-destructive ring-destructive/20 focus:border-destructive'
            : 'focus:ring-primary/20 focus:border-primary'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed pointer-events-none bg-muted/30'
            : ''
        } ${sizeClasses}`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.icon && <selectedOption.icon className="w-4 h-4 shrink-0 text-muted-foreground" />}
              <span className="font-medium text-foreground">{selectedOption.label}</span>
              {selectedOption.description && (
                <span className="text-muted-foreground text-xs font-normal">
                  ({selectedOption.description})
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground/70">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={`${chevronSize} shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-foreground' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Panel Dropdown (Portal ke body) */}
      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel || 'Daftar pilihan'}
            onKeyDown={handlePanelKeyDown}
            style={{
              position: 'fixed',
              top: coords.openUp ? 'auto' : `${coords.top}px`,
              bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
            className="z-[9999] rounded-xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden focus:outline-none animate-fade-down"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Opsional */}
            {searchable && (
              <div className="p-2 border-b border-border bg-muted/20">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full bg-card rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 border border-input focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* List Item Opsi */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto p-1 space-y-0.5 focus:outline-none scroll-smooth"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={`${opt.value}-${idx}`}
                      id={`${selectId}-option-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onMouseEnter={() => !opt.disabled && setHighlightedIndex(idx)}
                      onClick={() => !opt.disabled && handleSelect(opt)}
                      className={`group relative flex items-center justify-between gap-3 px-3 rounded-lg text-left transition-colors select-none min-h-[40px] max-sm:min-h-[44px] ${
                        size === 'sm'
                          ? 'py-2 text-xs'
                          : 'py-2.5 text-sm'
                      } ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'cursor-pointer'
                      } ${
                        isHighlighted && !opt.disabled
                          ? 'bg-primary/10 text-primary'
                          : isSelected
                          ? 'bg-primary/5 text-primary'
                          : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {opt.icon && (
                          <opt.icon
                            className={`shrink-0 ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
                              isSelected ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`truncate ${
                              isSelected ? 'font-semibold text-primary' : 'font-medium'
                            }`}
                          >
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className="text-[11px] text-muted-foreground truncate">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check
                          className={`shrink-0 text-primary ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
