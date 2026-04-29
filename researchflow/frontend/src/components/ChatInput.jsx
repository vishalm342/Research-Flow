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
            w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500/60
            text-white placeholder-zinc-500 text-sm leading-relaxed
            rounded-xl p-4 pr-28
            focus:outline-none focus:ring-2 focus:ring-emerald-500/20
            resize-none
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
              px-3 py-1.5 rounded-md
              border text-xs font-medium
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
              ${isResearchEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-500 hover:text-zinc-300'
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
              p-2 rounded-md
              bg-zinc-800 hover:bg-zinc-700
              border border-zinc-700
              text-zinc-300 hover:text-white
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 mt-2 text-center">
        <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">Enter</kbd>
        {' '}to send ·{' '}
        <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">Shift+Enter</kbd>
        {' '}for new line ·{' '}
        <span className={isResearchEnabled ? "text-emerald-400 font-semibold" : "text-zinc-600"}>
          ✦ Research mode {isResearchEnabled ? 'ON' : 'OFF'}
        </span>
      </p>
    </div>
  );
};

export default ChatInput;