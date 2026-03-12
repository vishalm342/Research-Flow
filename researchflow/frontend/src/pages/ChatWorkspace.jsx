import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { createConversation, getMessages, sendMessage } from '../api/chat';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';

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
      const pollRef = { id: null };
      const safetyTimeout = setTimeout(() => {
        clearInterval(pollRef.id);
      }, REPORT_POLL_TIMEOUT_MS);

      pollRef.id = setInterval(async () => {
        try {
          const fresh = await getMessages(convId);
          if (fresh.length > snapshotCount) {
            setMessages(fresh);
            clearInterval(pollRef.id);
            clearTimeout(safetyTimeout);
          }
        } catch (err) {
          console.error('Report poll failed:', err);
          clearInterval(pollRef.id);
          clearTimeout(safetyTimeout);
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

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {isEmpty ? (
        /* ── Hero / Empty State ─────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          {/* Glow orb */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl scale-150 pointer-events-none" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <span className="text-2xl">✦</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3 text-center">
            What do you want to research?
          </h1>
          <p className="text-slate-400 text-sm mb-10 text-center max-w-md">
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
                  bg-slate-800/70 border border-slate-700/60
                  text-slate-300 hover:text-white
                  hover:bg-slate-700/80 hover:border-indigo-500/50
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
                <ChatMessage
                  key={msg.message_id}
                  message={msg}
                  onResearchComplete={() =>
                    handleResearchComplete(
                      msg.conversation_id ?? currentConvId,
                      idx + 1,
                    )
                  }
                />
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
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