import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, onSubmit }) {
  return (
    <form className="search-bar" onSubmit={onSubmit}>
      <Search size={18} className="search-icon" />
      <label className="sr-only" htmlFor="search">Search items</label>
      <input
        id="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search keywords, items, brand, or places..."
      />
      {value && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => onChange('')}
          aria-label="Clear search"
          title="Clear search"
        >
          <X size={16} />
        </button>
      )}
      <button className="button primary search-submit-btn" type="submit">
        Search
      </button>
    </form>
  );
}
