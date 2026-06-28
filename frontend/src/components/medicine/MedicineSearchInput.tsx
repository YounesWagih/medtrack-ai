import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { medicineService } from '@/services/medicine.service';
import type { ExternalMedicineSearchItem } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MedicineSearchInputProps {
  placeholder?: string;
  onSelect?: (medicine: ExternalMedicineSearchItem) => void;
}

export function MedicineSearchInput({ placeholder = 'Search medicine...', onSelect }: MedicineSearchInputProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalMedicineSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const items = await medicineService.searchMedicines(searchQuery);
      setResults(items);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        search(query);
      }, 500);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (medicine: ExternalMedicineSearchItem) => {
    setIsOpen(false);
    setQuery('');
    if (onSelect) {
      onSelect(medicine);
      return;
    }
    navigate(`/medicines/details/${medicine.slug}`);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onFocus={() => {
              if (results.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            disabled={isLoading}
            className="pr-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {query && (
          <Button variant="outline" size="icon" onClick={handleClear} type="button">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="relative z-50 mt-2 w-full max-h-[min(56vh,28rem)] overflow-y-auto rounded-md border bg-background shadow-lg">
          {results.map((item) => (
            <button
              key={item.slug}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 border-b p-2.5 text-left last:border-b-0 hover:bg-accent focus:bg-accent focus:outline-none"
              type="button"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name_en || item.name_ar}
                  className="h-9 w-9 shrink-0 rounded bg-white object-contain"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name_en || item.name_ar}</p>
                {item.name_ar && item.name_en && item.name_ar !== item.name_en && (
                  <p className="text-sm text-muted-foreground truncate">{item.name_ar}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && !isLoading && (
        <div className="relative z-50 mt-2 w-full rounded-md border bg-background p-4 text-center text-muted-foreground shadow-lg">
          <p>No medicines found</p>
        </div>
      )}
    </div>
  );
}
