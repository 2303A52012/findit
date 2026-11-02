import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Handshake,
  PlusCircle,
  Eye,
  Pencil,
  MapPin,
  CalendarDays,
  Inbox
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import CategoryIcon from '../components/CategoryIcon';

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/me/items'), api.get('/me/claims')])
      .then(([itemsRes, claimsRes]) => {
        setItems(itemsRes.data);
        setClaims(claimsRes.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading your dashboard..." />;

  const lostCount = items.filter(i => i.reportType === 'Lost').length;
  const foundCount = items.filter(i => i.reportType === 'Found').length;

  return (
    <section className="page dashboard-page">
      {/* Top Welcome Header */}
      <div className="page-heading dashboard-header">
        <div>
          <span className="eyebrow">Personal Overview</span>
          <h1>My Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.name}</strong>. Track your active reports, manage listings, and view submitted claims.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <Link className="button primary" to="/report">
            <PlusCircle size={17} />
            <span>Report New Item</span>
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* 4 Professional Metric Stat Cards */}
      <div className="stat-cards-grid">
        <article className="stat-card">
          <div className="stat-card-icon default-icon">
            <FileText size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{items.length}</span>
            <span className="stat-card-label">Total Reports</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-icon lost-icon">
            <AlertCircle size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{lostCount}</span>
            <span className="stat-card-label">Lost Items</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-icon found-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{foundCount}</span>
            <span className="stat-card-label">Found Items</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-icon claims-icon">
            <Handshake size={22} />
          </div>
          <div className="stat-card-content">
            <span className="stat-card-value">{claims.length}</span>
            <span className="stat-card-label">My Claims</span>
          </div>
        </article>
      </div>

      {/* Section 1: My Reported Listings Table (Matching Image 1 Table Style) */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h2>My Reported Listings</h2>
            <p className="section-subtitle">Items you have reported to the community.</p>
          </div>
          {items.length > 0 && (
            <span className="badge-counter">{items.length} {items.length === 1 ? 'report' : 'reports'}</span>
          )}
        </div>

        {items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Current Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isLost = item.reportType === 'Lost';
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="table-item-cell">
                          <div className={`table-item-icon ${isLost ? 'lost' : 'found'}`}>
                            <CategoryIcon category={item.category} size={16} />
                          </div>
                          <Link to={`/items/${item._id}`} className="table-item-link" title={item.title}>
                            {item.title}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${item.reportType.toLowerCase()}`}>
                          {isLost ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />}
                          {item.reportType}
                        </span>
                      </td>
                      <td>
                        <span className="category-chip">
                          <CategoryIcon category={item.category} size={12} />
                          {item.category}
                        </span>
                      </td>
                      <td>
                        <span className="table-meta-text">
                          <MapPin size={13} /> {item.locationText}
                        </span>
                      </td>
                      <td>
                        <span className="table-meta-text">
                          <CalendarDays size={13} />{' '}
                          {item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            item.status === 'Resolved'
                              ? 'resolved'
                              : item.status === 'Removed'
                              ? 'removed'
                              : 'review'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-cell">
                          <Link
                            to={`/items/${item._id}`}
                            className="button secondary small table-action-btn"
                            title="View Details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </Link>
                          <Link
                            to={`/items/${item._id}/edit`}
                            className="button secondary small table-action-btn"
                            title="Edit Listing"
                          >
                            <Pencil size={14} />
                            <span>Edit</span>
                          </Link>
                        </div>
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
              <Inbox size={32} />
            </div>
            <h3>No reports created yet</h3>
            <p>You haven't reported any lost or found items. Submit a report to get started.</p>
            <Link className="button primary" to="/report">
              <PlusCircle size={16} />
              <span>Report an Item</span>
            </Link>
          </div>
        )}
      </div>

      {/* Section 2: Recent Claims Table */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h2>My Submitted Claims</h2>
            <p className="section-subtitle">Items you have claimed ownership of.</p>
          </div>
          <Link to="/claims" className="text-link">
            View all claims &rarr;
          </Link>
        </div>

        {claims.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Claimed Item</th>
                  <th>Item Type</th>
                  <th>Your Verification Message</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 5).map(claim => {
                  const item = claim.itemReportId;
                  const isLost = item?.reportType === 'Lost';
                  return (
                    <tr key={claim._id}>
                      <td>
                        {item ? (
                          <div className="table-item-cell">
                            <div className="table-item-icon found">
                              <CategoryIcon category={item.category} size={16} />
                            </div>
                            <Link to={`/items/${item._id}`} className="table-item-link">
                              {item.title}
                            </Link>
                          </div>
                        ) : (
                          <span className="text-muted">Item unavailable or removed</span>
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
                        <p className="table-claim-msg" title={claim.message}>
                          {claim.message}
                        </p>
                      </td>
                      <td>
                        <span className="table-meta-text">
                          <CalendarDays size={13} />{' '}
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            claim.status === 'Approved' || claim.status === 'Resolved'
                              ? 'resolved'
                              : claim.status === 'Rejected'
                                ? 'removed'
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
              <Handshake size={32} />
            </div>
            <h3>No claims submitted yet</h3>
            <p>When you see an item that belongs to you, submit a claim and track it here.</p>
            <Link className="button secondary" to="/items">
              Browse Items
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
