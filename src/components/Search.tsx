import { Search } from 'lucide-react';
import { ChangeEventHandler } from 'react';
import { Input } from './ui/input';

const SearchBar = (
  placeholder: string,
  value: string,
  onChange: ChangeEventHandler<HTMLInputElement>
) => {
  return (
    <div className="relative mb-4 h-9 grow rounded-lg bg-white">
      <Search
        className="absolute top-1/2 -translate-y-1/2 transform text-gray-400 ltr:right-3 rtl:left-3"
        size={16}
      />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg p-2 pl-10"
      />
    </div>
  );
};

export default SearchBar;
