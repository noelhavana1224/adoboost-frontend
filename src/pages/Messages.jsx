import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PageHeader, Card, Badge, Spinner, Empty, Pagination, Modal, Btn, Input } from '../components/UI';
import { MessageSquare, Search, Tag, Reply, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';

// ── Tag config ──────────────────────────────────
const TAGS = [
  { key: 'positive',       label: '🟢 Positive',       color: '#22c55e', bg: '#f0fff4', border: '#86efac' },
  { key: 'not_interested', label: '🔴 Not Interested',  color: '#ef4444', bg: '#fff5f5', border: '#fca5a5' },
  { key: 'follow_up',     label: '🔵 Follow Up',       color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
  { key: 'meeting_booked',label: '🟣 Meeting Booked',  color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
  { key: 'not_now',       label: '🟡 Not Now',          color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { key: 'auto_reply',    label: '⚙️ Auto-Reply',       color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
];
const TAG_MAP = Object.fromEntries(TAGS.map(t => [t.key, t]));

const AUTO_REPLY_KEYWORDS = [
  'out of office', 'auto-reply', 'automatic reply', 'autoreply',
  'i am away', 'i am out', 'on vacation', 'on leave', 'on holiday',
  'will be back', 'returning on', 'away from the office',
  'do not reply', 'noreply', 'no-reply', 'unmonitored',
  'this is an automated', 'automated response', 'automatic response',
];
function isAutoReply(message) {
  const text = `${message.subject || ''} ${message.from_email || ''}`.toLowerCase();
  return AUTO_REPLY_KEYWORDS.some(kw => text.includes(kw));
}

export default function Messages({ type = 'inbox' }) {
  const [messages, setMessages]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [filterTag, setFilterTag] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [replyModal, setReplyModal] = useState(null);
  const [tagLoading, setTagLoading] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = type === 'inbox' ? '/messages/inbox' : '/messages/auto-replies';
      const { data } = await api.get(endpoint, {
        params: { search: search || undefined, page, limit: 20, tag: filterTag || undefined }
      });
      setMessages(data.messages || []);
      setTotal(data.total || 0);
      setUnread(data.unread || 0);
    } catch (e) {
      toast.error('Failed to load messages');
    } finally { setLoading(false); }
  }, [type, search, page, filterTag]);

  useEffect(() => { load(); }, [load]);

  // ── Sync Now — triggers IMAP sync on all accounts then reloads ──
  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      // Get all email accounts and sync each one that has IMAP configured
      const { data: accounts } = await api.get('/email-accounts');
      const imapAccounts = accounts.filter(a => a.imap_host);

      if (imapAccounts.length === 0) {
        toast.error('No IMAP accounts configured. Set up IMAP in Email Accounts first.');
        return;
      }

      let totalSynced = 0;
      for (const acc of imapAccounts) {
        try {
          const { data } = await api.post(`/email-accounts/${acc.id}/sync-inbox`);
          totalSynced += data.synced || 0;
        } catch (e) {
          console.warn(`Sync failed for ${acc.username}:`, e.message);
        }
      }

      await load();
      if (totalSynced > 0) {
        toast.success(`✅ Synced ${totalSynced} new message${totalSynced !== 1 ? 's' : ''}!`);
      } else {
        toast.success('Inbox synced — no new messages.');
      }
    } catch (e) {
      toast.error('Sync failed — check your IMAP settings');
    } finally { setSyncing(false); }
  };

  const handleTag = async (messageId, tag) => {
    setTagLoading(p => ({ ...p, [messageId]: true }));
    try {
      await api.post(`/messages/${messageId}/tag`, { tag });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, tag } : m));
      toast.success('Tag updated!');
    } catch { toast.error('Failed to update tag'); }
    finally { setTagLoading(p => ({ ...p, [messageId]: false })); }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/read`, { status: 'read' });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'read' } : m));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const activeTab = type === 'inbox' ? '/messages/inbox' : '/messages/auto-replies';

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle={type === 'inbox'
          ? `Track and reply to campaign responses${unread > 0 ? ` · ${unread} unread` : ''}`
          : 'Auto-reply responses filtered automatically'}
        action={
          type === 'inbox' && (
            <Btn variant="secondary" onClick={handleSyncNow} disabled={syncing}>
              <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Btn>
          )
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
        {[
          { label: `📥 Inbox${unread > 0 ? ` (${unread})` : ''}`, path: '/messages/inbox' },
          { label: '⚙️ Auto-replies', path: '/messages/auto-replies' }
        ].map(t => (
          <a key={t.path} href={t.path} style={{
            padding: '10px 18px',
            borderBottom: `2px solid ${activeTab === t.path ? 'var(--primary)' : 'transparent'}`,
            marginBottom: -2,
            color: activeTab === t.path ? 'var(--primary)' : 'var(--text2)',
            fontWeight: activeTab === t.path ? 600 : 400,
            fontSize: 14, textDecoration: 'none', transition: 'all 0.15s'
          }}>{t.label}</a>
        ))}
      </div>

      {/* Search + Tag Filter + Sync Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input placeholder="Search messages..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', background: '#fff', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px 9px 32px', fontSize: 14, outline: 'none' }} />
        </div>

        {/* Tag Filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>Filter:</span>
          <button onClick={() => setFilterTag('')} style={{
            padding: '5px 12px', borderRadius: 20,
            border: `1px solid ${!filterTag ? 'var(--primary)' : 'var(--border2)'}`,
            background: !filterTag ? 'var(--primary-dim)' : '#fff',
            color: !filterTag ? 'var(--primary)' : 'var(--text2)',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: !filterTag ? 600 : 400,
          }}>All</button>
          {TAGS.filter(t => t.key !== 'auto_reply').map(tag => (
            <button key={tag.key} onClick={() => setFilterTag(filterTag === tag.key ? '' : tag.key)} style={{
              padding: '5px 12px', borderRadius: 20,
              border: `1px solid ${filterTag === tag.key ? tag.color : 'var(--border2)'}`,
              background: filterTag === tag.key ? tag.bg : '#fff',
              color: filterTag === tag.key ? tag.color : 'var(--text2)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: filterTag === tag.key ? 600 : 400,
            }}>{tag.label}</button>
          ))}
        </div>
      </div>

      {/* Auto-sync hint */}
      {type === 'inbox' && (
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={11} />
          Auto-syncs every 5 minutes · <button onClick={handleSyncNow} disabled={syncing}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}>
            {syncing ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
      )}

      {loading ? <Spinner /> : messages.length === 0 ? (
        <Empty icon={MessageSquare}
          title={filterTag ? `No ${TAG_MAP[filterTag]?.label} messages` : type === 'inbox' ? 'No messages yet' : 'No auto-replies yet'}
          description={
            filterTag ? 'Try a different filter or clear the tag filter.'
            : type === 'inbox' ? 'Replies from your campaigns will appear here. Click "Sync Now" to check immediately.'
            : 'Auto-replies from your campaigns will appear here.'
          }
          action={type === 'inbox' && !filterTag && (
            <Btn onClick={handleSyncNow} disabled={syncing} variant="secondary">
              <RefreshCw size={14} /> {syncing ? 'Syncing...' : 'Sync Now'}
            </Btn>
          )}
        />
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {messages.map((m, i) => {
            const tag = TAG_MAP[m.tag];
            const detectedAutoReply = isAutoReply(m);
            const isExpanded = expandedId === m.id;
            const isUnread = m.status === 'unread';

            return (
              <div key={m.id} style={{
                borderBottom: i < messages.length - 1 ? '1px solid var(--border)' : 'none',
                background: isUnread ? '#f8faff'
                  : m.tag === 'positive' ? '#f0fff4'
                  : m.tag === 'meeting_booked' ? '#f5f3ff'
                  : 'transparent',
                borderLeft: isUnread ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'background 0.15s',
              }}>
                <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                  <div style={{ minWidth: 0 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      {isUnread && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, display: 'inline-block' }} />
                      )}
                      <span style={{ fontWeight: isUnread ? 700 : 600, fontSize: 14 }}>{m.from_name || m.from_email}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{m.from_email}</span>
                      {detectedAutoReply && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>⚙️ Auto-Reply</span>
                      )}
                      {m.replied === 1 && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f0fff4', color: '#16a34a', border: '1px solid #86efac' }}>✅ Replied</span>
                      )}
                      {tag && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: tag.bg, color: tag.color, border: `1px solid ${tag.border}`, fontWeight: 600 }}>{tag.label}</span>
                      )}
                    </div>

                    {/* Subject */}
                    <div style={{ fontSize: 13, fontWeight: isUnread ? 600 : 500, marginBottom: 2, color: 'var(--text)' }}>
                      {m.subject || '(no subject)'}
                    </div>

                    {/* Meta */}
                    <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 12 }}>
                      {m.campaign_name && <span>📢 {m.campaign_name}</span>}
                      <span>🕐 {new Date(m.received_at).toLocaleString()}</span>
                    </div>

                    {/* Expanded body */}
                    {isExpanded && m.body && (
                      <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
                        {m.body}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                    {/* Expand/Collapse */}
                    <button onClick={() => {
                      setExpandedId(isExpanded ? null : m.id);
                      if (!isExpanded && isUnread) handleMarkRead(m.id);
                    }} style={{
                      background: 'none', border: '1px solid var(--border2)', borderRadius: 6,
                      padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--text2)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {isExpanded ? 'Collapse' : 'View'}
                    </button>

                    {/* Reply button */}
                    {type === 'inbox' && !detectedAutoReply && (
                      <button onClick={() => { setReplyModal(m); if (isUnread) handleMarkRead(m.id); }} style={{
                        background: 'var(--primary)', border: 'none', borderRadius: 6,
                        padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#fff',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Reply size={12} /> Reply
                      </button>
                    )}

                    {/* Tag selector */}
                    <TagSelector
                      currentTag={m.tag}
                      loading={tagLoading[m.id]}
                      onTag={(tag) => handleTag(m.id, tag)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              {total} message{total !== 1 ? 's' : ''}
              {unread > 0 && ` · ${unread} unread`}
              {filterTag && ` · filtered by ${TAG_MAP[filterTag]?.label}`}
            </span>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </div>
        </Card>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <ReplyModal
          message={replyModal}
          onClose={() => setReplyModal(null)}
          onSent={() => { setReplyModal(null); load(); toast.success('Reply sent! ✅'); }}
        />
      )}
    </div>
  );
}

// ── Tag Selector Dropdown ───────────────────────
function TagSelector({ currentTag, loading, onTag }) {
  const [open, setOpen] = useState(false);
  const tag = TAG_MAP[currentTag];

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(p => !p)} disabled={loading} style={{
        background: tag ? tag.bg : 'var(--bg3)',
        border: `1px solid ${tag ? tag.border : 'var(--border2)'}`,
        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
        fontSize: 12, color: tag ? tag.color : 'var(--text3)',
        display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
      }}>
        <Tag size={11} />
        {loading ? 'Saving...' : tag ? tag.label : 'Tag'}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: '#fff', border: '1px solid var(--border2)', borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 100,
            minWidth: 180, overflow: 'hidden',
          }}>
            {currentTag && (
              <button onClick={() => { onTag(null); setOpen(false); }} style={{
                width: '100%', padding: '8px 12px', border: 'none', background: 'none',
                textAlign: 'left', cursor: 'pointer', fontSize: 12, color: 'var(--text3)',
                display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: '1px solid var(--border)',
              }}>
                <X size={11} /> Remove tag
              </button>
            )}
            {TAGS.filter(t => t.key !== 'auto_reply').map(t => (
              <button key={t.key} onClick={() => { onTag(t.key); setOpen(false); }} style={{
                width: '100%', padding: '8px 12px', border: 'none',
                background: currentTag === t.key ? t.bg : 'transparent',
                textAlign: 'left', cursor: 'pointer', fontSize: 12,
                color: t.color, fontWeight: currentTag === t.key ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Reply Modal ─────────────────────────────────
function ReplyModal({ message, onClose, onSent }) {
  const [body, setBody]         = useState('');
  const [sending, setSending]   = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');

  useEffect(() => {
    api.get('/email-accounts').then(r => {
      setAccounts(r.data);
      if (r.data.length > 0) setAccountId(r.data[0].id);
    });
  }, []);

  const handleSend = async () => {
    if (!body.trim()) return toast.error('Please write a reply first');
    if (!accountId) return toast.error('Select an email account to send from');
    setSending(true);
    try {
      await api.post(`/messages/${message.id}/reply`, { body, email_account_id: accountId });
      onSent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reply');
    } finally { setSending(false); }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Reply to ${message.from_name || message.from_email}`} width={600}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Original message preview */}
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text2)', borderLeft: '3px solid var(--border2)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Original: {message.subject}</div>
          <div style={{ color: 'var(--text3)', lineHeight: 1.6, maxHeight: 100, overflowY: 'auto' }}>
            {message.body ? message.body.slice(0, 300) + (message.body.length > 300 ? '...' : '') : '(no body)'}
          </div>
        </div>

        {/* Send from account */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Send from</label>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} style={{
            width: '100%', background: '#fff', border: '1px solid var(--border2)', borderRadius: 8,
            padding: '9px 12px', fontSize: 13, outline: 'none', color: 'var(--text)',
          }}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.from_name} &lt;{a.from_email}&gt;</option>)}
          </select>
        </div>

        {/* Reply body */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Your reply</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={`Hi ${message.from_name || 'there'},\n\nThank you for your reply...`}
            rows={8}
            style={{
              width: '100%', background: '#fff', border: '1px solid var(--border2)', borderRadius: 8,
              padding: '10px 12px', fontSize: 13, outline: 'none', color: 'var(--text)',
              resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn loading={sending} onClick={handleSend}><Reply size={13} /> Send Reply</Btn>
        </div>
      </div>
    </Modal>
  );
}
