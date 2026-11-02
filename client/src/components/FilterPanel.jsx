import { Filter, RotateCcw, MapPin, Tag, Layers } from 'lucide-react';

const CATEGORIES = [
  'Electronics',
  'Documents',
  'Keys',
  'Bags',
  'Clothing',
  'Jewelry',
  'Other'
];

export default function FilterPanel({ filters, setFilters }) {
  function update(field, value) {
    setFilters(current => ({ ...current, [field]: value }));
  }

  const hasActiveFilters = Boolean(
    filters.type || filters.category || filters.location || filters.search
  );

  function clearAll() {
    setFilters({ search: '', type: '', category: '', location: '' });
  }

  return (
    <aside className="filter-panel-card">
      <div className="filter-panel-header">
        <div className="filter-title-group">
          <Filter size={18} className="filter-icon" />
          <h3>Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className="filter-reset-btn"
            onClick={clearAll}
            title="Reset all filters"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Listing Type Filter */}
      <div className="filter-group">
        <label className="filter-group-label">
          <Layers size={14} />
          <span>Listing Type</span>
        </label>
        <div className="type-toggle-group">
          <button
            type="button"
            className={`type-toggle-btn ${!filters.type ? 'active' : ''}`}
            onClick={() => update('type', '')}
          >
            All
          </button>
          <button
            type="button"
            className={`type-toggle-btn lost-pill ${filters.type === 'Lost' ? 'active' : ''}`}
            onClick={() => update('type', 'Lost')}
          >
            Lost
          </button>
          <button
            type="button"
            className={`type-toggle-btn found-pill ${filters.type === 'Found' ? 'active' : ''}`}
            onClick={() => update('type', 'Found')}
          >
            Found
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="filter-group">
        <label className="filter-group-label" htmlFor="filter-category">
          <Tag size={14} />
          <span>Category</span>
        </label>
        <select
          id="filter-category"
          className="filter-select"
          value={filters.category}
          onChange={e => update('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Location Filter */}
      <div className="filter-group">
        <label className="filter-group-label" htmlFor="filter-location">
          <MapPin size={14} />
          <span>Location</span>
        </label>
        <div className="filter-input-wrap">
          <input
            id="filter-location"
            className="filter-text-input"
            value={filters.location}
            onChange={e => update('location', e.target.value)}
            placeholder="e.g. Library, Park, Metro..."
          />
          {filters.location && (
            <button
              type="button"
              className="clear-input-inline"
              onClick={() => update('location', '')}
              aria-label="Clear location filter"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="filter-panel-footer">
          <button className="button secondary full small" type="button" onClick={clearAll}>
            Clear all filters
          </button>
        </div>
      )}
    </aside>
  );
}
