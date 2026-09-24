import { Search } from 'lucide-react'
import './SearchInput.css'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  className = ''
}: SearchInputProps) {
  return (
    <div className={`search-input ${className}`}>
      <Search size={18} className="search-input__icon" />
      <input
        type="text"
        className="search-input__field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
