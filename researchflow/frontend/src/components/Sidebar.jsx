import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, MessageSquare, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { getConversations } from '../api/chat';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Group conversations by relative date label */
const getDateGroup = (dateStr) => {
  const date  = new Date(dateStr);
  const now   = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7)  return 'Previous 7 Days';
  return 'Previous 30 Days';
};

const GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ConversationItem = ({ conv, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer
      transition-all duration-150 text-sm text-left group
      ${isActive
        ? 'bg-slate-800 text-white'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
    `}
  >
    <MessageSquare
      size={14}
      className={`flex-shrink-0 transition-colors ${
        isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'
      }`}
    />
    <span className="truncate leading-snug">{conv.title || 'Untitled conversation'}</span>
  </button>
);

const GroupSection = ({ label, items, activeId, onSelect }) => (
  <div>
    <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </p>
    <ul className="space-y-0.5">
      {items.map((conv) => (
        <li key={conv.conversation_id}>
          <ConversationItem
            conv={conv}
            isActive={activeId === conv.conversation_id}
            onClick={() => onSelect(conv.conversation_id)}
          />
        </li>
      ))}
    </ul>
  </div>
);

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

const Sidebar = () => {
  const navigate   = useNavigate();
  const location   = useLocation();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  // Extract active conversation id from URL  /c/:conversationId
  const activeId = location.pathname.startsWith('/c/')
    ? location.pathname.split('/c/')[1]
    : null;

  // -------------------------------------------------------------------------
  // Load conversations
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getConversations();
        if (!cancelled) setConversations(data ?? []);
      } catch (err) {
        console.error('Failed to load conversations:', err);
        if (!cancelled) setError('Could not load history.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [location.pathname]); // re-fetch whenever navigation happens (new conv created)

  // -------------------------------------------------------------------------
  // Group conversations by date
  // -------------------------------------------------------------------------
  const grouped = conversations.reduce((acc, conv) => {
    const label = getDateGroup(conv.updated_at ?? conv.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(conv);
    return acc;
  }, {});

  return (
    <aside className="flex flex-col h-full w-full bg-sidebar border-r border-slate-700/80">
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-700/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">
              Research<span className="text-indigo-400">Flow</span>
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">AI Research Assistant</p>
          </div>
        </div>
      </div>

      {/* ── New Research button ───────────────────────────────────────────── */}
      <div className="px-3 py-3 flex-shrink-0 border-b border-slate-700/80">
        <button
          onClick={() => {
            navigate('/');
          }}
          className="
            w-full flex items-center justify-center gap-2
            bg-gradient-to-r from-indigo-500 to-purple-600
            hover:from-indigo-400 hover:to-purple-500
            text-white shadow-lg rounded-xl p-3
            font-medium text-sm
            transition-all duration-200 active:scale-[0.98]
          "
        >
          <Plus size={16} />
          New Research
        </button>
      </div>

      {/* ── Conversation list ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="mx-2 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-slate-500">No conversations yet.</p>
            <p className="text-xs text-slate-600 mt-1">Start by clicking New Research!</p>
          </div>
        )}

        {!loading && !error && GROUP_ORDER.map((label) => {
          const items = grouped[label];
          if (!items?.length) return null;
          return (
            <GroupSection
              key={label}
              label={label}
              items={items}
              activeId={activeId}
              onSelect={(id) => navigate(`/c/${id}`)}
            />
          );
        })}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-slate-700/80 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={12} />
          <span>
            {loading
              ? 'Loading…'
              : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;