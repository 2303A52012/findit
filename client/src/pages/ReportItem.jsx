import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Image as ImageIcon,
  HelpCircle,
  Tag,
  Sparkles,
  Search
} from 'lucide-react';
import api from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import CategoryIcon from '../components/CategoryIcon';

const blank = {
  reportType: 'Lost',
  title: '',
  category: '',
  description: '',
  eventDate: new Date().toISOString().slice(0, 10),
  locationText: '',
  imageUrl: ''
};

const CATEGORIES = [
  'Electronics',
  'Documents',
  'Keys',
  'Bags',
  'Clothing',
  'Jewelry',
  'Other'
];

export default function ReportItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [imgPreviewError, setImgPreviewError] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/items/${id}`)
      .then(({ data }) =>
        setForm({
          ...data,
          eventDate: data.eventDate ? data.eventDate.slice(0, 10) : ''
        })
      )
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function update(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'imageUrl') {
      setImgPreviewError(false);
    }
  }

  function setType(type) {
    setForm(prev => ({ ...prev, reportType: type }));
  }

  function setCategory(cat) {
    setForm(prev => ({ ...prev, category: cat }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!form.category) {
      return setError('Please select a category for this item.');
    }

    if (form.description.trim().length < 10) {
      return setError('Description must be at least 10 characters long.');
    }

    setSubmitting(true);
    try {
      if (id) {
        await api.patch(`/items/${id}`, form);
      } else {
        await api.post('/items', form);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isLost = form.reportType === 'Lost';

  return (
    <section className="page report-page">
      <div className="report-container">
        <div className="report-header">
          <div className="report-header-nav">
            <Link to="/items" className="back-link">
              <ArrowLeft size={16} />
              <span>Back to listings</span>
            </Link>
          </div>
          <span className="eyebrow">{id ? 'Update Existing Listing' : 'Community Recovery'}</span>
          <h1>{id ? 'Edit Report' : 'Report an Item'}</h1>
          <p className="report-header-desc">
            Provide detailed, accurate information to help identify and safely reconnect this item
            with its owner.
          </p>
        </div>

        <ErrorMessage message={error} />

        {loading ? (
          <div className="loading">Loading report details...</div>
        ) : (
          <form className="report-form-card" onSubmit={submit}>
            {/* Step 1: Type Selection Cards */}
            <div className="form-section">
              <label className="section-title-label">
                <span>1. Are you reporting a lost or found item?</span>
              </label>

              <div className="report-type-selector-grid">
                <button
                  type="button"
                  className={`type-choice-card lost-choice ${isLost ? 'selected' : ''}`}
                  onClick={() => setType('Lost')}
                >
                  <div className="choice-icon-wrap lost">
                    <Search size={22} />
                  </div>
                  <div className="choice-text">
                    <div className="choice-title-row">
                      <strong>I Lost Something</strong>
                      {isLost && <span className="choice-check"><CheckCircle2 size={16} /></span>}
                    </div>
                    <p>You misplaced or lost personal property and need community help recovering it.</p>
                  </div>
                </button>

                <button
                  type="button"
                  className={`type-choice-card found-choice ${!isLost ? 'selected' : ''}`}
                  onClick={() => setType('Found')}
                >
                  <div className="choice-icon-wrap found">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="choice-text">
                    <div className="choice-title-row">
                      <strong>I Found Something</strong>
                      {!isLost && <span className="choice-check"><CheckCircle2 size={16} /></span>}
                    </div>
                    <p>You found an unattended item and want to help reconnect it with the rightful owner.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Item Information */}
            <div className="form-section">
              <label className="section-title-label">
                <span>2. Item Details</span>
              </label>

              <div className="form-field">
                <label htmlFor="title">
                  Item Title <span className="req">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.title}
                  onChange={update}
                  placeholder={
                    isLost
                      ? 'e.g. Silver MacBook Air 13" with blue stickers'
                      : 'e.g. Ring of keys with Toyota key fob and black carabiner'
                  }
                />
                <span className="field-hint">Be specific: include brand, color, or key visible features.</span>
              </div>

              <div className="form-field">
                <label htmlFor="category">
                  Category <span className="req">*</span>
                </label>
                <div className="category-select-wrapper">
                  <select
                    id="category"
                    name="category"
                    required
                    value={form.category}
                    onChange={update}
                  >
                    <option value="">-- Select a Category --</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Category Chips */}
                <div className="category-quick-chips">
                  {CATEGORIES.map(cat => (
                    <button
                      type="button"
                      key={cat}
                      className={`cat-chip-btn ${form.category === cat ? 'active' : ''}`}
                      onClick={() => setCategory(cat)}
                    >
                      <CategoryIcon category={cat} size={13} />
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="description">
                  Detailed Description <span className="req">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  minLength={10}
                  rows={4}
                  value={form.description}
                  onChange={update}
                  placeholder="Describe unique characteristics, scratches, casing, brand, marks, or contents that can verify identity..."
                />
                <div className="textarea-footer">
                  <span className="field-hint">
                    {form.description.length < 10
                      ? `Minimum 10 characters (${form.description.length}/10)`
                      : `${form.description.length} characters`}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Where and When */}
            <div className="form-section">
              <label className="section-title-label">
                <span>3. Time & Location</span>
              </label>

              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="eventDate">
                    Date {isLost ? 'Lost' : 'Found'} <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Calendar size={16} className="input-icon" />
                    <input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      required
                      value={form.eventDate}
                      onChange={update}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="locationText">
                    Location / Area <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <MapPin size={16} className="input-icon" />
                    <input
                      id="locationText"
                      name="locationText"
                      required
                      value={form.locationText}
                      onChange={update}
                      placeholder="e.g. City Central Library, 3rd Floor"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Photo / Visual Preview */}
            <div className="form-section">
              <label className="section-title-label">
                <span>4. Image URL (Optional)</span>
              </label>

              <div className="form-field">
                <div className="input-with-icon">
                  <ImageIcon size={16} className="input-icon" />
                  <input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    value={form.imageUrl}
                    onChange={update}
                    placeholder="https://images.unsplash.com/... or hosted picture link"
                  />
                </div>
                <span className="field-hint">
                  A photo greatly improves the chance of successful recovery and identification.
                </span>
              </div>

              {/* Live Image Preview */}
              {form.imageUrl && (
                <div className="live-preview-box">
                  <span className="preview-label">Photo Preview:</span>
                  {!imgPreviewError ? (
                    <div className="preview-thumbnail">
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        onError={() => setImgPreviewError(true)}
                      />
                      <button
                        type="button"
                        className="preview-remove-btn"
                        onClick={() => {
                          setForm(p => ({ ...p, imageUrl: '' }));
                          setImgPreviewError(false);
                        }}
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <div className="preview-error-note">
                      <AlertCircle size={16} />
                      <span>Could not load image from this URL. Please verify the link.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="report-actions-row">
              <Link to="/items" className="button secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="button primary submit-report-btn"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : id ? 'Save Changes' : isLost ? 'Report Lost Item' : 'Report Found Item'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
