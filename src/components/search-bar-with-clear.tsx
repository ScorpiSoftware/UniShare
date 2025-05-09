"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarWithClearProps {
  placeholder: string;
  defaultValue?: string;
  baseUrl: string;
  tabParam?: string;
  className?: string;
}

export default function SearchBarWithClear({
  placeholder,
  defaultValue = "",
  baseUrl,
  tabParam,
  className,
}: SearchBarWithClearProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(defaultValue);
  const [showClearButton, setShowClearButton] = useState(!!defaultValue);

  // Update the search value when defaultValue changes
  useEffect(() => {
    setSearchValue(defaultValue);
    setShowClearButton(!!defaultValue);
  }, [defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build the URL with search parameter
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (tabParam) params.set("tab", tabParam);

    // Reset to page 1 when search changes
    params.set("page", "1");

    // Navigate to the URL
    router.push(`${baseUrl}?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchValue("");
    setShowClearButton(false);

    // Build the URL without search parameter
    const params = new URLSearchParams();
    if (tabParam) params.set("tab", tabParam);

    // Reset to page 1
    params.set("page", "1");

    // Navigate to the URL
    const queryString = params.toString() ? `?${params.toString()}` : "";
    router.push(`${baseUrl}${queryString}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 search-icon-wrapper">
        <Search className="h-4 w-4 text-primary/80 search-icon" />
      </div>
      <Input
        name="search"
        placeholder={placeholder}
        className={`pl-11 pr-11 ${className || ''} w-full placeholder:text-muted-foreground/70 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none active:outline-none rounded-full outline-none search-input-no-outline border-transparent`}
        style={{ textOverflow: 'ellipsis' }}
        value={searchValue}
        onChange={(e) => {
          setSearchValue(e.target.value);
          setShowClearButton(!!e.target.value);
        }}
      />
      {showClearButton && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 search-icon-wrapper">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 hover:bg-primary/10 transition-colors duration-200"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-primary/80 search-icon" />
            <span className="sr-only">Clear search</span>
          </Button>
        </div>
      )}
    </form>
  );
}
