import { useEffect, useState } from 'react';
import {
  CalendarDays,
  MapPin,
  Pencil,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Send,
  MessageCircle,
  Lock,
  PackageCheck,
  Handshake,
  Clock,
  ShieldCheck
} from 'lucide-react';
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

  async function handleHandshake(claimId, action) {
    setError('');
    setSuccess('');
    try {
      const { data } = await api.patch(`/items/claims/${claimId}/handshake`, { action });
      setClaims(current => current.map(c => (c._id === claimId ? data.claim : c)));
      if (data.itemResolved) {
        setItem(current => ({ ...current, status: 'Resolved' }));
      }
      setSuccess(data.message || 'Handover status updated successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update handover status.');
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

            // Identify user roles in this claim
            // If item.reportType is 'Lost':
            //   - Item owner is User 1 (Lost the item -> Receiver)
            //   - Claimant is User 2 (Found the item -> Sender)
            // If item.reportType is 'Found':
            //   - Item owner is User 2 (Found the item -> Sender)
            //   - Claimant is User 1 (Lost the item -> Receiver)
            const isLostReport = item.reportType === 'Lost';
            const rawOwnerId = item?.ownerId?._id || item?.ownerId;
            const currentUserId = user.id || user._id;
            const rawClaimantId = claimant?._id || claimant;

            const loserId = isLostReport ? rawOwnerId?.toString() : rawClaimantId?.toString();
            const finderId = isLostReport ? rawClaimantId?.toString() : rawOwnerId?.toString();

            const isLoser = currentUserId?.toString() === loserId;
            const isFinder = currentUserId?.toString() === finderId;
            const isModerator = user.role === 'moderator';

            const isChatDisabled = Boolean(
              claim.chatDisabled ||
              (claim.senderSent && claim.receiverReceived) ||
              claim.status === 'Approved' ||
              claim.status === 'Rejected' ||
              item.status === 'Resolved' ||
              item.status === 'Removed'
            );

            return (
              <article className="claim-chat-card" key={claim._id}>
                <div className="claim-chat-header">
                  <div>
                    <strong>{claimant?.name || 'Claimant'}</strong>
                    <span className="claim-status-pill">{claim.status}</span>
                  </div>
                  {isChatDisabled && (
                    <span className="chat-disabled-tag">
                      <Lock size={12} /> Chat Closed
                    </span>
                  )}
                </div>

                {/* Handover Verification Controls Strip */}
                <div className="handshake-bar">
                  <div className="handshake-status-group">
                    <span className={`handshake-chip ${claim.senderSent ? 'confirmed' : 'pending'}`}>
                      {claim.senderSent ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      Finder Handover: {claim.senderSent ? 'Sent' : 'Pending'}
                    </span>
                    <span className={`handshake-chip ${claim.receiverReceived ? 'confirmed' : 'pending'}`}>
                      {claim.receiverReceived ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      Owner Receipt: {claim.receiverReceived ? 'Received' : 'Pending'}
                    </span>
                  </div>

                  <div className="handshake-actions">
                    {/* User 2 (Finder) sees Sent button */}
                    {(isFinder || isModerator) && (
                      <button
                        type="button"
                        className="handshake-btn sent-btn"
                        onClick={() => handleHandshake(claim._id, 'sent')}
                        disabled={claim.senderSent || isChatDisabled}
                        title={claim.senderSent ? 'Marked as Sent' : 'Confirm you sent or handed over the item'}
                      >
                        <PackageCheck size={14} />
                        {claim.senderSent ? 'Sent' : 'Mark as Sent'}
                      </button>
                    )}

                    {/* User 1 (Lost item owner) sees Received button */}
                    {(isLoser || isModerator) && (
                      <button
                        type="button"
                        className="handshake-btn received-btn"
                        onClick={() => handleHandshake(claim._id, 'received')}
                        disabled={claim.receiverReceived || isChatDisabled}
                        title={claim.receiverReceived ? 'Marked as Received' : 'Confirm you received your lost item'}
                      >
                        <Handshake size={14} />
                        {claim.receiverReceived ? 'Received' : 'Mark as Received'}
                      </button>
                    )}

                    {/* Administrator / Moderator direct approval button */}
                    {isModerator && !isChatDisabled && (
                      <button
                        type="button"
                        className="handshake-btn admin-btn"
                        onClick={() => handleHandshake(claim._id, 'admin_approve')}
                        title="Administrator approval (confirms both sent and received)"
                      >
                        <ShieldCheck size={14} />
                        Admin Approve
                      </button>
                    )}
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

                {isChatDisabled ? (
                  <div className="claim-chat-disabled-banner">
                    <Lock size={16} />
                    <span>
                      Item handover verified & completed. Chat access has been disabled for both users and administrators.
                    </span>
                  </div>
                ) : (
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
                )}
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
