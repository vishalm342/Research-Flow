import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  Pencil, 
  Pin, 
  Trash2, 
  LogOut,
  Check,
  X 
} from 'lucide-react';
import { getConversations } from '../api/chat';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { API_BASE_URL } from '../utils/constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const ConversationItem = ({ conv, isActive, onClick, onRename, onDelete, onPin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(conv.title || '');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRename = () => {
    if (editValue.trim() && editValue !== conv.title) {
      onRename(conv.conversation_id, editValue);
    }
    setIsEditing(false);
  };

  if (isDeleting) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-500/10 border-l-2 border-red-500 rounded-r-md">
        <span className="text-xs text-red-400 font-medium truncate">Delete?</span>
        <div className="flex items-center gap-2">
          <button onClick={() => onDelete(conv.conversation_id)} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase">Yes</button>
          <button onClick={() => setIsDeleting(false)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase">No</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      {isEditing ? (
        <div className="px-3 py-1.5">
          <input
            autoFocus
            className="w-full bg-zinc-800 text-white text-sm px-2 py-1 rounded border border-emerald-500/50 outline-none"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setIsEditing(false); setEditValue(conv.title); }
            }}
          />
        </div>
      ) : (
        <button
          onClick={onClick}
          className={`
            w-full flex items-center gap-3 py-2 px-3 rounded-r-md cursor-pointer
            transition-all duration-150 text-sm text-left
            ${isActive
              ? 'bg-emerald-500/10 border-l-2 border-emerald-500 text-white'
              : 'border-l-2 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}
          `}
        >
          <MessageSquare
            size={14}
            className={`flex-shrink-0 transition-colors ${
              isActive ? 'text-emerald-500' : 'text-zinc-500 group-hover:text-zinc-400'
            }`}
          />
          <div className="flex-1 truncate pr-16 flex items-center gap-1.5">
            {conv.is_pinned && <Pin size={10} className="text-zinc-500 shrink-0" />}
            <span className="truncate leading-snug">{conv.title || 'Untitled conversation'}</span>
          </div>
        </button>
      )}

      {!isEditing && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onPin(conv.conversation_id, !conv.is_pinned); }} 
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <Pin size={13} className={conv.is_pinned ? "fill-current" : ""} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }} 
            className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

const GroupSection = ({ label, items, activeId, onSelect, onRename, onDelete, onPin }) => (
  <div className="mb-4">
    <p className="px-3 mb-1 text-zinc-500 uppercase tracking-widest text-[10px] font-medium">
      {label}
    </p>
    <ul className="space-y-[1px]">
      {items.map((conv) => (
        <li key={conv.conversation_id}>
          <ConversationItem
            conv={conv}
            isActive={activeId === conv.conversation_id}
            onClick={() => onSelect(conv.conversation_id)}
            onRename={onRename}
            onDelete={onDelete}
            onPin={onPin}
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
  const user       = auth.currentUser;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const activeId = location.pathname.startsWith('/c/')
    ? location.pathname.split('/c/')[1]
    : null;

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
  }, [location.pathname]);

  const handleRename = async (id, newTitle) => {
    try {
      setConversations(prev => prev.map(c => c.conversation_id === id ? { ...c, title: newTitle } : c));
      await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      setConversations(prev => prev.filter(c => c.conversation_id !== id));
      if (activeId === id) navigate('/app');
      await fetch(`${API_BASE_URL}/api/conversations/${id}`, { method: 'DELETE' });
    } catch (err) { console.error(err); }
  };

  const handlePin = async (id, isPinned) => {
    try {
      setConversations(prev => prev.map(c => c.conversation_id === id ? { ...c, is_pinned: isPinned } : c));
      await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: isPinned }),
      });
    } catch (err) { console.error(err); }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const pinnedConversations = conversations.filter(c => c.is_pinned);
  const unpinnedConversations = conversations.filter(c => !c.is_pinned);

  const grouped = unpinnedConversations.reduce((acc, conv) => {
    const label = getDateGroup(conv.updated_at ?? conv.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(conv);
    return acc;
  }, {});

  const userInitial = user?.displayName?.[0] || user?.email?.[0] || '?';

  return (
    <aside className="flex flex-col h-full w-full bg-zinc-950 border-r border-zinc-800/80">
      <div className="px-4 pt-5 pb-4 border-b border-zinc-800/80 flex-shrink-0">
        <Logo size={28} showText={true} subtitle={true} />
      </div>

      <div className="px-3 py-3 flex-shrink-0 border-b border-zinc-800/80">
        <button onClick={() => navigate('/app')} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md px-3 py-2.5 font-medium text-sm transition-all active:scale-[0.98]">
          <Plus size={16} /> New Research
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {pinnedConversations.length > 0 && (
          <GroupSection
            label="Pinned"
            items={pinnedConversations}
            activeId={activeId}
            onSelect={(id) => navigate(`/c/${id}`)}
            onRename={handleRename}
            onDelete={handleDelete}
            onPin={handlePin}
          />
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
              onRename={handleRename}
              onDelete={handleDelete}
              onPin={handlePin}
            />
          );
        })}
      </div>

      <div className="px-3 py-3 border-t border-zinc-800/80 relative">
        {isProfileOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
        
        <div 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors group"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} className="w-9 h-9 rounded-full object-cover" alt="Profile" />
            ) : (
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&background=16a34a&color=fff&size=72&bold=true&length=1`} 
                className="w-9 h-9 rounded-full object-cover" 
                alt="Profile" 
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.displayName || user?.email?.split('@')[0] || 'User'}</p>
            <p className="text-zinc-500 text-xs truncate">{user?.email || 'No email provided'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;