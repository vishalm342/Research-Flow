import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, Copy, Edit2, Check, ArrowUpRight } from 'lucide-react';
import TerminalLog from './TerminalLog';
import { getMessages } from '../api/chat';
import { API_BASE_URL } from '../utils/constants';

const ChatMessage = ({ message, onResearchComplete, onWorkflowComplete, onEdit, onFollowup }) => {
  const isAssistant = message.role === 'assistant';
  const metadata = message.metadata || {};
  const [copied, setCopied] = useState(false);
  
  // Research is pending if it has research_id but no report yet
  const isResearchPending = metadata.type === 'research_report' && metadata.research_id && !metadata.report_id;
  
  // Report is complete if it has both research_id AND report_id
  const isReportComplete = metadata.type === 'research_report' && metadata.report_id;

  const handleWorkflowComplete = async (sessionId, conversationId) => {
    // Wait a bit for the report to be saved to DB
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Trigger parent to re-fetch all messages
    if (onWorkflowComplete) {
      onWorkflowComplete(sessionId, conversationId);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert plain text URLs to markdown links so ReactMarkdown renders them as <a> tags
  const formatContent = (content) => {
    if (!content) return '';
    return content.replace(/(?<!\]\()(?<!<)(https?:\/\/[^\s<>()]+)/g, '[$1]($1)');
  };

  if (!isAssistant) {
    return (
      <div className="flex justify-end w-full group">
        <div className="flex flex-col items-end gap-1.5 max-w-2xl">
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl rounded-tr-sm px-4 py-3 md:px-5">
            <p className="text-zinc-100 text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {/* Action buttons (Copy & Edit) */}
          <div className="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleCopy}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-800 transition-colors"
              title="Copy prompt"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(message.content)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-800 transition-colors"
                title="Edit & retry"
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show terminal while research is running
  if (isResearchPending) {
    return (
      <div className="flex justify-start w-full max-w-full overflow-hidden">
        <div className="w-full max-w-full lg:max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-zinc-400">✦</span>
            </div>
            <span className="text-xs font-medium text-zinc-400">ResearchFlow</span>
          </div>
          
          <TerminalLog
            sessionId={metadata.research_id}
            conversationId={message.conversation_id}
            onComplete={onResearchComplete}
            onWorkflowComplete={handleWorkflowComplete}
          />
        </div>
      </div>
    );
  }

  // Show completed report with quality score, copy button, download button, and follow-up suggestions
  if (isReportComplete) {
    const handleDownloadPDF = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports/${metadata.report_id}/export?format=pdf`);
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${metadata.report_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('PDF download failed:', error);
      }
    };

    // Determine quality score color ramp
    const score = metadata.quality_score;
    const hasScore = score !== null && score !== undefined;
    const scoreColor = hasScore
      ? score >= 7
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        : score >= 5
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-red-400 bg-red-500/10 border-red-500/30'
      : '';

    const followups = Array.isArray(metadata.followups) ? metadata.followups : [];

    return (
      <div className="flex justify-start w-full max-w-full overflow-hidden">
        <div className="w-full max-w-full lg:max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-zinc-400">✦</span>
            </div>
            <span className="text-xs font-medium text-zinc-400">ResearchFlow</span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-5 md:px-6 shadow-sm w-full">
            {/* ── Report header bar ── */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-700/50 gap-3 flex-wrap">
              <h3 className="text-sm font-semibold text-zinc-300">📄 Research Report</h3>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Quality Score badge */}
                {hasScore && (
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${scoreColor}`}
                    title="Report quality score from the Critic agent (0–10)"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {score.toFixed(1)} / 10
                  </span>
                )}

                {/* Copy button with toast */}
                <div className="relative">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-700/40 hover:bg-zinc-700/70 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all"
                    title="Copy report to clipboard"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  {/* Toast notification */}
                  {copied && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-700 text-zinc-100 text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg border border-zinc-600 pointer-events-none z-10">
                      ✓ Copied to clipboard
                    </div>
                  )}
                </div>

                {/* PDF download */}
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-all"
                >
                  <Download size={14} />
                  PDF
                </button>
              </div>
            </div>

            {/* ── Markdown report body ── */}
            <div className="prose prose-invert prose-zinc max-w-full w-full text-left prose-headings:text-zinc-100 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-emerald-400 prose-strong:text-zinc-200 prose-p:text-zinc-300 prose-p:leading-relaxed text-[15px]">
              <ReactMarkdown>{formatContent(message.content)}</ReactMarkdown>
            </div>

            {/* ── Follow-up research suggestions ── */}
            {followups.length > 0 && (
              <div className="mt-6 pt-5 border-t border-zinc-700/50">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                  Follow-up Research
                </p>
                <div className="flex flex-col gap-2">
                  {followups.map((q, idx) => (
                    <FollowupCard key={idx} question={q} onFollowup={onFollowup} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular assistant message
  return (
    <div className="flex justify-start w-full max-w-full overflow-hidden">
      <div className="w-full max-w-full lg:max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-zinc-400">✦</span>
          </div>
          <span className="text-xs font-medium text-zinc-400">ResearchFlow</span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-5 md:px-6 shadow-sm w-full">
          <div className="prose prose-invert prose-zinc max-w-full w-full prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-p:text-sm md:prose-p:text-base prose-a:text-emerald-400 prose-strong:text-zinc-200">
            <ReactMarkdown>{formatContent(message.content)}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Follow-up card sub-component
// ─────────────────────────────────────────────────────────────────────────────
const FollowupCard = ({ question, onFollowup }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onFollowup && onFollowup(question)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center justify-between w-full text-left px-4 py-3 rounded-xl border border-zinc-700/60 hover:border-emerald-500/40 bg-zinc-800/30 hover:bg-zinc-800/60 transition-all duration-200 group"
    >
      <span className="text-sm text-zinc-300 group-hover:text-zinc-100 leading-snug pr-3 transition-colors">
        {question}
      </span>
      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-zinc-700/50 group-hover:bg-emerald-500/20 transition-all">
        <ArrowUpRight size={14} className={hovered ? 'text-emerald-400' : 'text-zinc-500'} />
      </span>
    </button>
  );
};

export default ChatMessage;