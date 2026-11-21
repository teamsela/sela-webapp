'use client';
 
import { IconSearch } from '@tabler/icons-react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
 
//export default function Search({ placeholder }: { placeholder: string }) {
const SearchBar = ({ placeholder } : { placeholder: string }) => {

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term) => {
    console.log(`Searching... ${term}`);

    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 500);
  
  return (
    <div className="sm:block">
      <div className="relative">
        <button type="button" tabIndex={-1} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-body">
        <IconSearch />  
        </button>
        <label htmlFor="search" className="sr-only">
          Search
        </label>
      <input
        id="search"
        type="search"
        className="peer block h-11 w-full rounded-xl border border-stroke bg-white pl-10 text-base outline-2 placeholder:text-body lg:h-auto lg:w-1/2 lg:rounded-md lg:py-[9px] lg:text-sm"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get('query')?.toString()}
      />
      </div>
    </div>
  );
}

export default SearchBar;
