import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Handshake,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CalendarDays,
  Eye,
  Search
} from 'lucide-react';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import CategoryIcon from '../components/CategoryIcon';

export default function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/me/claims')
      .then(({ data }) => setClaims(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading your claims..." />;

  const pendingCount = claims.filter(
    c => c.status === 'Pending' || c.status === 'Under Review'
  ).length;

  return (
    <section className="page claims-page">
      {/* Page Heading */}
      <div className="page-heading claims-header">
        <div>
          <span className="eyebrow">Recovery Tracker</span>
          <h1>My Claims</h1>
          <p className="claims-subtitle">
            Review all claims you have submitted for reported items. When an owner confirms your
            claim, you will be notified to coordinate recovery.
          </p>
        </div>
        <div className="claims-header-actions">
          <Link to="/items" className="button secondary">
            <Search size={16} />
            <span>Browse More Items</span>
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* KPI Stats Strip */}
      <div className="stat-cards-grid claims-stat-grid">
        <article className="stat-card">
          <div className="stat-card-icon claims-icon">
            <Handshake size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{claims.length}</span>
            <span className="stat-card-label">Total Claims Filed</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-icon lost-icon">
            <Clock size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{pendingCount}</span>
            <span className="stat-card-label">Pending Review</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-icon found-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">
              {claims.filter(c => c.status === 'Approved' || c.status === 'Resolved').length}
            </span>
            <span className="stat-card-label">Approved / Resolved</span>
          </div>
        </article>
      </div>

      {/* Full Claims Table */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h2>Submitted Claims History</h2>
            <p className="section-subtitle">
              All records of claims you have created across the community.
            </p>
          </div>
          {claims.length > 0 && (
            <span className="badge-counter">
              {claims.length} {claims.length === 1 ? 'claim' : 'claims'}
            </span>
          )}
        </div>

        {claims.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Claimed Item</th>
                  <th>Listing Type</th>
                  <th>Item Location</th>
                  <th>Date Filed</th>
                  <th>Your Verification Note</th>
                  <th>Claim Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map(claim => {
                  const item = claim.itemReportId;
                  const isLost = item?.reportType === 'Lost';
                  return (
                    <tr key={claim._id}>
                      <td>
                        {item ? (
                          <div className="table-item-cell">
                            <div className={`table-item-icon ${isLost ? 'lost' : 'found'}`}>
                              <CategoryIcon category={item.category} size={16} />
                            </div>
                            <div>
                              <Link
                                to={`/items/${item._id}`}
                                className="table-item-link"
                                title={item.title}
                              >
                                {item.title}
                              </Link>
                              <span className="table-sub-cat">{item.category}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">Item removed or unavailable</span>
                        )}
                      </td>
                      <td>
                        {item ? (
                          <span className={`badge ${item.reportType.toLowerCase()}`}>
                            {isLost ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />}
                            {item.reportType}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {item ? (
                          <span className="table-meta-text">
                            <MapPin size={13} /> {item.locationText}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span className="table-meta-text">
                          <CalendarDays size={13} />{' '}
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="claim-note-cell">
                          <p className="table-claim-msg" title={claim.message}>
                            "{claim.message}"
                          </p>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            claim.status === 'Approved' || claim.status === 'Resolved'
                              ? 'resolved'
                              : 'review'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td>
                        {item && (
                          <Link
                            to={`/items/${item._id}`}
                            className="button secondary small table-action-btn"
                            title="View Item Listing"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-card dashboard-empty">
            <div className="empty-state-icon-circle">
              <Handshake size={34} />
            </div>
            <h3>No claims submitted yet</h3>
            <p>
              When you identify an item you own in the community directory, submit a claim with
              identifying details. It will show up here.
            </p>
            <Link className="button primary" to="/items">
              <Search size={16} />
              <span>Browse Community Items</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
