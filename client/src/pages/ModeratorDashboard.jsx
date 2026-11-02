import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function ModeratorDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const params = {
        includeRemoved: 'true',
        status: statusFilter
      };
      const { data } = await api.get('/items', { params });
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  async function updateStatus(item, newStatus) {
    if (newStatus === item.status) return;
    setError('');
    setSuccess('');
    try {
      await api.patch(`/items/${item._id}`, { status: newStatus });
      setItems(current =>
        current.map(value => (value._id === item._id ? { ...value, status: newStatus } : value))
      );
      setSuccess(`Status for "${item.title}" updated to "${newStatus}".`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      if (err.message?.includes('permission')) {
        setError(
          'Permission denied. Your session does not have moderator privileges. Please log out and sign in with an authorized Administrator account.'
        );
      } else {
        setError(err.message || 'Failed to update item status.');
      }
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Moderator tools</span>
          <h1>Review listings</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="filterStatus" style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>
            Filter by status:
          </label>
          <select
            id="filterStatus"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', padding: '6px 12px' }}
          >
            <option value="all">All reports</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Removed">Removed</option>
          </select>
        </div>
      </div>

      <ErrorMessage message={error} />
      {success && <div className="alert success">{success}</div>}

      {loading ? (
        <Loading text="Loading listings..." />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No reports found</h3>
          <p>There are no listings matching the selected status filter.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Category</th>
                <th>Reporter</th>
                <th>Location</th>
                <th>Current Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.title}</strong>
                  </td>
                  <td>
                    <span className={`badge ${item.reportType.toLowerCase()}`}>
                      {item.reportType}
                    </span>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.ownerId?.name || 'Unknown'}</td>
                  <td>{item.locationText}</td>
                  <td>
                    <span className="status-pill">{item.status}</span>
                  </td>
                  <td>
                    <select
                      aria-label={`Status for ${item.title}`}
                      value={item.status}
                      onChange={e => updateStatus(item, e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px' }}
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Removed">Removed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
