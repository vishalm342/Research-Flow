import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

const ChatInput = ({ value, onChange, onSubmit, disabled }) => {
  const textareaRef = useRef(null);
  // CRITICAL: Default to TRUE so research is enabled by default
  const [isResearchEnabled, setIsResearchEnabled] = useState(true);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        // CRITICAL: Pass isResearchEnabled as second argument
        onSubmit(value, isResearchEnabled);
      }
    }
  };

  const handleSendClick = () => {
    if (value.trim() && !disabled) {
      // CRITICAL: Pass isResearchEnabled as second argument
      onSubmit(value, isResearchEnabled);
    }
  };

  return (
    <div className="w-full px-4 pb-4 pt-2">
      <div className="relative w-full max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or describe a research topic…"
          disabled={disabled}
          rows={1}
          className="
            w-full bg-slate-800/80 backdrop-blur-md
            border border-slate-600/50 focus:border-indigo-500/60
            text-white placeholder-slate-500 text-sm leading-relaxed
            rounded-2xl p-4 pr-28
            focus:outline-none focus:ring-2 focus:ring-indigo-500/30
            shadow-xl resize-none
            max-h-40 overflow-y-auto scrollbar-thin
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        />

        {/* Action buttons — positioned inside the textarea */}
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {/* Research toggle button */}
          <button
            onClick={() => setIsResearchEnabled(!isResearchEnabled)}
            disabled={disabled}
            title={isResearchEnabled ? "Research mode enabled (click to disable)" : "Research mode disabled (click to enable)"}
            className={`
              flex items-center gap-1.5
              px-3 py-1.5 rounded-xl
              border text-xs font-medium
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150 shadow-md
              ${isResearchEnabled
                ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-700/80 hover:bg-slate-600 border-slate-600/50 hover:border-slate-500 text-slate-400 hover:text-slate-300'
              }
            `}
          >
            <Sparkles size={13} className={isResearchEnabled ? 'text-white' : ''} />
            Research
          </button>

          {/* Send button */}
          <button
            onClick={handleSendClick}
            disabled={disabled || !value.trim()}
            title="Send message (Enter)"
            className="
              p-2 rounded-xl
              bg-slate-700 hover:bg-slate-600
              border border-slate-600/50 hover:border-slate-500
              text-slate-300 hover:text-white
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150 shadow-md
            "
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-600 mt-2 text-center">
        <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-500">Enter</kbd>
        {' '}to send ·{' '}
        <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-500">Shift+Enter</kbd>
        {' '}for new line ·{' '}
        <span className={isResearchEnabled ? "text-indigo-400 font-semibold" : "text-slate-600"}>
          ✦ Research mode {isResearchEnabled ? 'ON' : 'OFF'}
        </span>
      </p>
    </div>
  );
};

export default ChatInput;