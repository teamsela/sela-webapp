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
        <button className="absolute left-2 top-1/2 -translate-y-1/2">
        <IconSearch />  
        </button>
        <label htmlFor="search" className="sr-only">
          Search
        </label>
      <input
        className="peer block w-1/2 rounded-md border py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
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
