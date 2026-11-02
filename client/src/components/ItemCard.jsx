import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function ItemCard({ item }) {
  const [imgError, setImgError] = useState(false);
  const isLost = item.reportType === 'Lost';
  const hasImage = Boolean(item.imageUrl && !imgError);

  const formattedDate = item.eventDate
    ? new Date(item.eventDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Date not specified';

  return (
    <article className="item-card">
      <div className={`item-image-wrapper ${hasImage ? 'has-img' : 'placeholder-mode'}`}>
        {hasImage ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            onError={() => setImgError(true)}
            className="item-cover-img"
            loading="lazy"
          />
        ) : (
          <div className={`item-placeholder-art ${isLost ? 'lost-art' : 'found-art'}`}>
            <div className="placeholder-icon-circle">
              <CategoryIcon category={item.category} size={36} />
            </div>
            <span className="placeholder-category-label">{item.category || 'Item'}</span>
          </div>
        )}

        <div className="card-top-badges">
          <span className={`badge ${isLost ? 'lost' : 'found'}`}>
            {isLost ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
            {item.reportType}
          </span>
          {item.status && (
            <span className={`status-pill-small ${item.status === 'Resolved' ? 'resolved' : 'review'}`}>
              {item.status}
            </span>
          )}
        </div>
      </div>

      <div className="item-card-body">
        <div className="item-card-header">
          <span className="category-chip">
            <CategoryIcon category={item.category} size={13} />
            {item.category}
          </span>
        </div>

        <h3 className="item-title" title={item.title}>
          {item.title}
        </h3>

        <div className="item-meta-group">
          <p className="meta" title={item.locationText}>
            <MapPin size={15} />
            <span className="meta-text">{item.locationText}</span>
          </p>
          <p className="meta">
            <CalendarDays size={15} />
            <span className="meta-text">{formattedDate}</span>
          </p>
        </div>

        <div className="item-card-footer">
          <Link className="item-card-cta" to={`/items/${item._id}`}>
            <span>View Details</span>
            <ArrowRight size={15} className="cta-arrow" />
          </Link>
        </div>
      </div>
    </article>
  );
}
