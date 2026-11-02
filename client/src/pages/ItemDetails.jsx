import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Pencil, Trash2, ArrowLeft, AlertCircle, CheckCircle2, Send, MessageCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import CategoryIcon from '../components/CategoryIcon';

export default function ItemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imgError, setImgError] = useState(false);
  const [claims, setClaims] = useState([]);
  const [conversations, setConversations] = useState({});
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    api
      .get(`/items/${id}`)
      .then(({ data }) => setItem(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !item) return;
    loadConversations();
  }, [item, user]);

  async function loadClaimConversations(claimList) {
    const entries = await Promise.all(
      claimList.map(async claim => {
        const { data } = await api.get(`/items/claims/${claim._id}/messages`);
        return [claim._id, data];
      })
    );
    setConversations(Object.fromEntries(entries));
  }

  async function loadConversations() {
    try {
      const { data } = await api.get(`/items/${id}/claims`);
      setClaims(data);
      await loadClaimConversations(data);
    } catch (err) {
      if (!err.message?.includes('participant')) setError(err.message);
    }
  }

  const ownerId = item?.ownerId?._id || item?.ownerId;
  const canManage = user && (user.id === ownerId || user.role === 'moderator');

  async function claim(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post(`/items/${id}/claims`, { message });
      setMessage('');
      setSuccess('Your claim was submitted successfully.');
      setClaims([data]);
      await loadClaimConversations([data]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendConversationMessage(claimId) {
    const text = drafts[claimId]?.trim();
    if (!text) return;
    setError('');
    try {
      const { data } = await api.post(`/items/claims/${claimId}/messages`, { message: text });
      setConversations(current => ({
        ...current,
        [claimId]: [...(current[claimId] || []), data]
      }));
      setDrafts(current => ({ ...current, [claimId]: '' }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    if (!window.confirm('Remove this report?')) return;
    try {
      await api.delete(`/items/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loading />;
  if (!item) {
    return (
      <section className="page">
        <ErrorMessage message={error || 'Item not found'} />
        <Link to="/items" className="text-link">
          &larr; Back to all items
        </Link>
      </section>
    );
  }

  const isLost = item.reportType === 'Lost';
  const hasImage = Boolean(item.imageUrl && !imgError);

  return (
    <section className="page details-page">
      <div className="details-header-nav">
        <Link to="/items" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to browse</span>
        </Link>
      </div>

      <ErrorMessage message={error} />

      <article className="details-grid">
        <div className={`details-image ${hasImage ? 'has-img' : 'placeholder-mode'}`}>
          {hasImage ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`details-placeholder-box ${isLost ? 'lost-art' : 'found-art'}`}>
              <div className="details-placeholder-icon">
                <CategoryIcon category={item.category} size={64} />
              </div>
              <span className="details-placeholder-label">{item.category}</span>
            </div>
          )}
        </div>

        <div className="details-content">
          <div className="details-badges-row">
            <span className={`badge ${item.reportType.toLowerCase()}`}>
              {isLost ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
              {item.reportType}
            </span>
            <span className="category-chip">
              <CategoryIcon category={item.category} size={13} />
              {item.category}
            </span>
            <span className="details-status">
              Status: <strong>{item.status}</strong>
            </span>
          </div>

          <h1>{item.title}</h1>
          <p className="item-description-text">{item.description}</p>

          <div className="detail-meta">
            <span>
              <CalendarDays size={18} />
              {new Date(item.eventDate).toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <span>
              <MapPin size={18} />
              {item.locationText}
            </span>
          </div>

          <p className="reporter">
            Reported by <strong>{item.ownerId?.name || 'Community member'}</strong>
          </p>

          {canManage && (
            <div className="actions">
              <Link className="button secondary" to={`/items/${id}/edit`}>
                <Pencil size={17} /> Edit
              </Link>
              <button className="button danger" onClick={remove}>
                <Trash2 size={17} /> Remove
              </button>
            </div>
          )}
        </div>
      </article>

      {user && ownerId !== user.id && claims.length === 0 && (
        <form className="claim-card" onSubmit={claim}>
          <h2>Claim this item</h2>
          <p>
            Explain how you can verify ownership (e.g. distinguishing marks, serial numbers,
            contents, or passcode description).
          </p>
          {success && <div className="alert success">{success}</div>}
          <label>
            Your claim message
            <textarea
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Provide specific details that prove this belongs to you..."
            />
          </label>
          <button className="button primary">Submit claim</button>
        </form>
      )}

      {user && claims.length > 0 && (
        <div className="claim-conversations">
          <div className="section-header-row">
            <div>
              <h2><MessageCircle size={21} /> Claim conversations</h2>
              <p className="section-subtitle">Private messages with the user for this claim.</p>
            </div>
          </div>
          {claims.map(claim => {
            const claimant = claim.claimantId;
            const messages = conversations[claim._id] || [];
            return (
              <article className="claim-chat-card" key={claim._id}>
                <div className="claim-chat-header">
                  <div>
                    <strong>{claimant?.name || 'Claimant'}</strong>
                    <span>{claim.status}</span>
                  </div>
                </div>
                <div className="claim-chat-messages">
                  {messages.length ? messages.map(chatMessage => {
                    const senderId = chatMessage.senderId?._id || chatMessage.senderId;
                    const mine = senderId === user.id;
                    return (
                      <div
                        key={chatMessage._id}
                        className={`claim-chat-message ${mine ? 'mine' : ''}`}
                      >
                        <strong>{mine ? 'You' : chatMessage.senderId?.name || 'User'}</strong>
                        <p>{chatMessage.message}</p>
                        <small>{new Date(chatMessage.createdAt).toLocaleString()}</small>
                      </div>
                    );
                  }) : <p className="claim-chat-empty">No messages yet.</p>}
                </div>
                <div className="claim-chat-compose">
                  <input
                    value={drafts[claim._id] || ''}
                    onChange={e => setDrafts(current => ({ ...current, [claim._id]: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendConversationMessage(claim._id);
                      }
                    }}
                    placeholder="Write a private message..."
                    maxLength={2000}
                  />
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => sendConversationMessage(claim._id)}
                    disabled={!drafts[claim._id]?.trim()}
                  >
                    <Send size={16} /> Send
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!user && (
        <div className="claim-card">
          <p>
            <Link to="/login" className="text-link">
              Log in
            </Link>{' '}
            to submit a claim for this item.
          </p>
        </div>
      )}
    </section>
  );
}
