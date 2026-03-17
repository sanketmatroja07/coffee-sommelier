import { useState, useEffect, useRef, useCallback } from "react";

interface Suggestion {
  lat: number;
  lng: number;
  display_name: string;
}

interface LocationSearchProps {
  apiBase: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (lat: number, lng: number, displayName: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

export function LocationSearch({
  apiBase,
  value,
  onChange,
  onSelect,
  placeholder = "Search city or address",
  className = "",
  inputClassName = "",
  autoFocus = false,
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `${apiBase}/api/v1/geocode/autocomplete?q=${encodeURIComponent(q)}&limit=6`
        );
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [apiBase]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
      setIsOpen(true);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  const handleSelect = (s: Suggestion) => {
    onSelect(s.lat, s.lng, s.display_name);
    onChange(s.display_name);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`location-search ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className={inputClassName}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      {loading && (
        <span className="location-search__spinner" aria-hidden="true">
          …
        </span>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="location-search__dropdown" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lng}-${s.display_name}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`location-search__item ${i === activeIndex ? "active" : ""}`}
              onClick={() => handleSelect(s)}
            >
              <span className="location-search__item-text">{s.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
