import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, X, PlusCircle, SearchX, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function BrowseItems() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    type: params.get('type') || '',
    category: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync when URL query param changes
  useEffect(() => {
    const urlType = params.get('type') || '';
    if (urlType !== filters.type) {
      setFilters(prev => ({ ...prev, type: urlType }));
    }
  }, [params]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const active = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => Boolean(value && value.trim()))
      );
      const { data } = await api.get('/items', { params: active });
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filters.type, filters.category, filters.location]);

  function removeFilter(key) {
    setFilters(prev => ({ ...prev, [key]: '' }));
    if (key === 'type' && params.has('type')) {
      params.delete('type');
      setParams(params);
    }
  }

  function clearAllFilters() {
    setFilters({ search: '', type: '', category: '', location: '' });
    if (params.has('type')) {
      params.delete('type');
      setParams(params);
    }
  }

  const activeFilterList = [
    filters.search && { key: 'search', label: `Keyword: "${filters.search}"` },
    filters.type && { key: 'type', label: `Type: ${filters.type}` },
    filters.category && { key: 'category', label: `Category: ${filters.category}` },
    filters.location && { key: 'location', label: `Location: ${filters.location}` }
  ].filter(Boolean);

  const lostCount = items.filter(i => i.reportType === 'Lost').length;
  const foundCount = items.filter(i => i.reportType === 'Found').length;

  return (
    <section className="page browse-page">
      <div className="browse-header-row">
        <div>
          <span className="eyebrow">Community Directory</span>
          <h1 className="browse-title">Browse Lost & Found</h1>
          <p className="browse-subtitle">
            Search items reported by community members or file a report to recover what's yours.
          </p>
        </div>
        <div className="browse-header-actions">
          <Link to="/report" className="button primary report-cta-btn">
            <PlusCircle size={18} />
            <span>Report Item</span>
          </Link>
        </div>
      </div>

      <div className="browse-search-wrapper">
        <SearchBar
          value={filters.search}
          onChange={value => setFilters({ ...filters, search: value })}
          onSubmit={e => {
            e.preventDefault();
            load();
          }}
        />
      </div>

      {/* Top Filter Chips Bar */}
      <div className="browse-meta-bar">
        <div className="browse-count-info">
          {!loading && (
            <>
              <span className="count-total">
                <strong>{items.length}</strong> {items.length === 1 ? 'item' : 'items'} listed
              </span>
              <span className="count-divider">&bull;</span>
              <span className="count-pill lost">
                <AlertCircle size={12} /> {lostCount} Lost
              </span>
              <span className="count-pill found">
                <CheckCircle2 size={12} /> {foundCount} Found
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          className="mobile-filter-toggle"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
        >
          <Filter size={16} />
          <span>{mobileFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
          {activeFilterList.length > 0 && (
            <span className="mobile-badge-count">{activeFilterList.length}</span>
          )}
        </button>
      </div>

      {/* Active Filter Chips */}
      {activeFilterList.length > 0 && (
        <div className="active-chips-strip">
          <span className="active-chips-label">Active filters:</span>
          {activeFilterList.map(item => (
            <button
              key={item.key}
              type="button"
              className="active-filter-chip"
              onClick={() => removeFilter(item.key)}
              title="Click to remove filter"
            >
              <span>{item.label}</span>
              <X size={13} />
            </button>
          ))}
          <button
            type="button"
            className="clear-all-chips-btn"
            onClick={clearAllFilters}
          >
            Clear all
          </button>
        </div>
      )}

      <div className="browse-layout">
        <div className={`filter-sidebar-wrapper ${mobileFilterOpen ? 'mobile-open' : ''}`}>
          <FilterPanel filters={filters} setFilters={setFilters} />
        </div>

        <div className="browse-main-content">
          <ErrorMessage message={error} />

          {loading ? (
            <div className="browse-loading-wrap">
              <Loading />
            </div>
          ) : items.length ? (
            <div className="item-grid">
              {items.map(item => (
                <ItemCard item={item} key={item._id} />
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-state-icon-circle">
                <SearchX size={38} />
              </div>
              <h3>No matching items found</h3>
              <p>
                We couldn't find anything matching your current filters or search terms.
                Try adjusting your criteria or check back later.
              </p>
              <div className="empty-state-actions">
                {activeFilterList.length > 0 && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={clearAllFilters}
                  >
                    Reset all filters
                  </button>
                )}
                <Link to="/report" className="button primary">
                  <PlusCircle size={16} />
                  <span>Report an item</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
