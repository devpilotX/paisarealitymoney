'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CITIES, type City } from '@/lib/cities';

interface CitySelectorProps {
  currentSlug?: string;
  basePath: string;
  placeholder?: string;
}

export default function CitySelector({
  currentSlug,
  basePath,
  placeholder = 'Search for a city...',
}: CitySelectorProps): React.ReactElement {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCities = useMemo((): City[] => {
    if (!searchTerm.trim()) return CITIES;
    const term = searchTerm.toLowerCase();
    return CITIES.filter(
      (city) =>
        city.name.toLowerCase().includes(term) ||
        city.state.toLowerCase().includes(term) ||
        city.nameHi.includes(searchTerm)
    );
  }, [searchTerm]);

  const handleSelect = useCallback(
    (city: City): void => {
      setSearchTerm('');
      setIsOpen(false);
      router.push(`${basePath}/${city.slug}`);
    },
    [router, basePath]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setSearchTerm(e.target.value);
      setIsOpen(true);
    },
    []
  );

  const handleFocus = useCallback((): void => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCity = currentSlug ? CITIES.find((c) => c.slug === currentSlug) : undefined;

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <label htmlFor="city-search" className="block text-sm font-medium text-ink mb-1">
        Select City
      </label>
      <input
        id="city-search"
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={currentCity ? `${currentCity.name}, ${currentCity.state}` : placeholder}
        className="input-field"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      />

      {isOpen && filteredCities.length > 0 && (
        <ul
          className="absolute z-40 w-full mt-1 bg-paper border border-line rounded-[5px] shadow-lg
                     max-h-60 overflow-y-auto"
          role="listbox"
        >
          {filteredCities.map((city) => (
            <li key={city.slug}>
              <button
                type="button"
                onClick={() => handleSelect(city)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200
                           hover:bg-paper-2 hover:text-navy min-h-[44px]
                           ${city.slug === currentSlug ? 'bg-paper-2 text-navy font-medium' : 'text-ink'}`}
                role="option"
                aria-selected={city.slug === currentSlug}
              >
                <span className="font-medium">{city.name}</span>
                <span className="text-muted-2 ml-2">{city.state}</span>
                {city.isMetro && (
                  <span className="ml-2 text-xs font-bold bg-brand-yellow-soft/70 text-brown px-1.5 py-0.5 rounded-[3px]">Metro</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && filteredCities.length === 0 && searchTerm.trim() && (
        <div className="absolute z-40 w-full mt-1 bg-paper border border-line rounded-[5px] shadow-lg p-4">
          <p className="text-sm text-muted-2 text-center">No cities found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}