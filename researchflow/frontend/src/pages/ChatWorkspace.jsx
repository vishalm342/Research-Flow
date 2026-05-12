import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { createConversation, getMessages, sendMessage } from '../api/chat';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';

/**
 * Memoized wrapper so the chat list never re-renders a message just because
 * the parent re-renders (e.g. after setMessages / setLoading).
 * It builds the stable per-message callbacks internally.
 */
const MemoizedChatMessage = memo(({ message, msgIdx, totalMessages, currentConvId, onEdit, onFollowup, onResearchComplete }) => {
  const convId = message.conversation_id ?? currentConvId;
  return (
    <ChatMessage
      message={message}
      onEdit={onEdit}
      onFollowup={onFollowup}
      onResearchComplete={() => onResearchComplete(convId, msgIdx + 1)}
      onWorkflowComplete={(_sessionId, wfConvId) => onResearchComplete(wfConvId ?? convId, totalMessages)}
    />
  );
}, (prev, next) => {
  // Only re-render if the message content/metadata changed, or key callbacks changed identity
  return (
    prev.message.message_id === next.message.message_id &&
    prev.message.content    === next.message.content &&
    prev.message.metadata?.report_id  === next.message.metadata?.report_id &&
    prev.message.metadata?.research_id === next.message.metadata?.research_id &&
    prev.totalMessages      === next.totalMessages &&
    prev.onResearchComplete === next.onResearchComplete &&
    prev.onFollowup         === next.onFollowup &&
    prev.onEdit             === next.onEdit
  );
});

const REPORT_POLL_INTERVAL_MS = 2000;
const REPORT_POLL_TIMEOUT_MS  = 30_000;

const SUGGESTIONS = [
  'Impact of AI on healthcare in 2025',
  'Quantum computing breakthroughs this year',
  'Climate tech startups to watch',
  'The future of remote work & productivity',
];

const ChatWorkspace = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [currentConvId, setCurrentConvId] = useState(conversationId || null);
  const messagesEndRef = useRef(null);
  // Track active poll intervals per convId to prevent duplicate polling
  const activePollsRef = useRef({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      if (conversationId) {
        try {
          const msgs = await getMessages(conversationId);
          setMessages(msgs);
          setCurrentConvId(conversationId);
        } catch (err) {
          console.error('Failed to load conversation:', err);
        }
      } else {
        // We are on the root route, stay in the empty state
        setMessages([]);
        setCurrentConvId(null);
      }
    };
    init();
  }, [conversationId]);

  const handleResearchComplete = useCallback(
    (convId, snapshotCount) => {
      // Guard: only one active poll per conversation at a time
      if (activePollsRef.current[convId]) return;

      const pollRef = { id: null, timeout: null };
      activePollsRef.current[convId] = pollRef;

      const cleanup = () => {
        clearInterval(pollRef.id);
        clearTimeout(pollRef.timeout);
        delete activePollsRef.current[convId];
      };

      pollRef.timeout = setTimeout(cleanup, REPORT_POLL_TIMEOUT_MS);

      pollRef.id = setInterval(async () => {
        try {
          const fresh = await getMessages(convId);
          if (fresh.length > snapshotCount) {
            setMessages(fresh);
            cleanup();
          }
        } catch (err) {
          console.error('Report poll failed:', err);
          cleanup();
        }
      }, REPORT_POLL_INTERVAL_MS);
    },
    [],
  );

  // CRITICAL: Accept isResearchEnabled as a parameter
  const handleSendMessage = async (text, isResearchEnabled = true) => {
    const trimmedText = text.trim();
    if (!trimmedText || loading) return;

    let targetConvId = conversationId;

    // Lazy creation: if there is no active conversation, create one first
    if (!targetConvId) {
      setLoading(true);
      try {
        const newConv = await createConversation();
        targetConvId = newConv.conversation_id;
        setCurrentConvId(targetConvId);
        navigate(`/c/${targetConvId}`, { replace: true });
      } catch (err) {
        console.error('Failed to create conversation lazily:', err);
        setLoading(false);
        return;
      }
    }

    const tempMsg = {
      message_id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmedText,
      created_at: new Date().toISOString(),
      metadata: {},
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInput('');
    setLoading(true);

    try {
      // CRITICAL: Pass isResearchEnabled to the API
      const assistantMsg = await sendMessage(targetConvId, trimmedText, isResearchEnabled);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.message_id !== tempMsg.message_id);
        return [...withoutTemp, tempMsg, assistantMsg];
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.message_id !== tempMsg.message_id));
      setInput(trimmedText);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill the chat input with a follow-up question and auto-submit it as a research session
  const handleFollowup = useCallback((question) => {
    setInput(question);
    // Small timeout so the input visually updates before submission
    setTimeout(() => handleSendMessage(question, true), 80);
  }, [loading, currentConvId, conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {isEmpty ? (
        /* ── Hero / Empty State ─────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          {/* Glow orb */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl scale-150 pointer-events-none" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl">
              <span className="text-2xl text-black">✦</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3 text-center">
            What do you want to research?
          </h1>
          <p className="text-zinc-400 text-sm mb-10 text-center max-w-md">
            Ask anything or pick a suggestion below — I'll run a full multi-agent
            deep-research workflow for you.
          </p>

          {/* Input in hero position */}
          <div className="w-full max-w-3xl">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSendMessage}
              disabled={loading}
            />
          </div>

          {/* Suggestion pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-2xl">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  // CRITICAL: Pass true for research mode on suggestion clicks
                  handleSendMessage(s, true);
                }}
                className="
                  px-4 py-2 rounded-full text-sm
                  bg-zinc-900 border border-zinc-800
                  text-zinc-300 hover:text-white
                  hover:bg-zinc-800 hover:border-emerald-500/50
                  transition-all duration-150 backdrop-blur-sm
                "
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Chat view ──────────────────────────────────────────────────── */
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <MemoizedChatMessage
                  key={msg.message_id}
                  message={msg}
                  msgIdx={idx}
                  totalMessages={messages.length}
                  currentConvId={currentConvId}
                  onEdit={setInput}
                  onFollowup={handleFollowup}
                  onResearchComplete={handleResearchComplete}
                />
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2 text-emerald-400/80">
                      <Loader className="animate-spin" size={16} />
                      <span className="text-sm">Thinking…</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sticky bottom input */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSendMessage}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
};

export default ChatWorkspace;