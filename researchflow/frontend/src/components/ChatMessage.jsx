import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Copy, Download } from 'lucide-react';
import TerminalLog from './TerminalLog';

// ---------------------------------------------------------------------------
// Source Pill
// ---------------------------------------------------------------------------
const SourcePill = ({ source, index }) => {
  const url = source?.url || source;
  if (!url) return null;

  let domain = url;
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    domain = url.length > 30 ? `${url.slice(0, 30)}…` : url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="
        flex items-center gap-1.5
        bg-zinc-800 hover:bg-zinc-700
        border border-zinc-700
        text-zinc-300 text-xs
        px-3 py-1.5 rounded-full
        transition-all cursor-pointer shadow-sm
      "
    >
      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center text-[10px] font-bold">
        {index + 1}
      </span>
      <span className="max-w-[140px] truncate">{domain}</span>
      <ExternalLink size={10} className="text-zinc-400" />
    </a>
  );
};

// ---------------------------------------------------------------------------
// Sources Row
// ---------------------------------------------------------------------------
const SourcesRow = ({ sources }) => {
  if (!sources?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 w-full">
      {sources.map((src, idx) => (
        <SourcePill key={idx} source={src} index={idx} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Assistant message – Markdown + optional sources
// ---------------------------------------------------------------------------
const AssistantMessage = ({ message, onComplete, onWorkflowComplete }) => {
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const isReport = message.metadata?.type === 'research_report';
  const isResearchStub = message.metadata?.research_id && !isReport;

  const sources = isReport ? message.metadata?.sources : null;
  // REMOVED hardcoded fallback per requirements
  const qualityScore = message.metadata?.quality_score ?? null;
  const reportId = message.metadata?.report_id;

  const handleDownloadPDF = async () => {
    if (!reportId) {
      console.error('No report ID available for download');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}/export?format=pdf`);
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Downloading PDF...');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="flex justify-start w-full max-w-full overflow-hidden">
      <div className="w-full max-w-full lg:max-w-3xl">
        {/* Avatar row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-zinc-400">✦</span>
          </div>
          <span className="text-xs font-medium text-zinc-400">
            ResearchFlow
          </span>
        </div>

        {/* If it's a research stub, ONLY show the terminal block */}
        {isResearchStub ? (
          <TerminalLog
            sessionId={message.metadata.research_id}
            onComplete={onComplete}
            onWorkflowComplete={onWorkflowComplete}
          />
        ) : (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-5 md:px-6 shadow-sm w-full max-w-full overflow-hidden">
            {isReport && <SourcesRow sources={sources} />}

            <div
              className="
                prose prose-invert prose-zinc max-w-full w-full text-left
                prose-headings:text-zinc-100 prose-headings:font-bold
                prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                prose-a:text-emerald-400 hover:prose-a:text-emerald-300
                prose-strong:text-zinc-200
                prose-code:text-emerald-300 prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-zinc-800 prose-pre:max-w-full prose-pre:overflow-x-auto
                prose-blockquote:border-emerald-500/50 prose-blockquote:text-zinc-400 prose-blockquote:bg-emerald-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                prose-li:text-zinc-300 prose-li:marker:text-emerald-500
                prose-hr:border-zinc-700/50
                prose-p:text-zinc-300 prose-p:leading-relaxed text-[15px]
              "
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>

            {/* Footer Action Bar - flex-wrap ensures layout doesn't break at high zoom */}
            <div className="border-t border-zinc-800 mt-6 pt-4 flex flex-wrap items-center justify-between gap-y-4 gap-x-6 select-none w-full">
              <div className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                {qualityScore && `Quality Score: ${qualityScore}/10`}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(message.content);
                    showToast('Copied to clipboard!');
                  }}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs font-medium bg-zinc-800/60 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                >
                  <Copy size={13} /> Copy to Clipboard
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={!reportId}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs font-medium bg-zinc-800/60 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Download size={13} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {toast !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 text-white text-sm px-4 py-2 rounded-full shadow-lg pointer-events-none"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// User message
// ---------------------------------------------------------------------------
const UserMessage = ({ message }) => (
  <div className="flex justify-end w-full max-w-full overflow-hidden">
    <div className="
      bg-emerald-700 text-white
      rounded-2xl rounded-tr-sm
      px-5 py-3 max-w-[85%] sm:max-w-[80%]
      shadow-md
      text-sm whitespace-pre-wrap leading-relaxed text-left
    ">
      {message.content}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------
const ChatMessage = ({ message, onResearchComplete, onWorkflowComplete }) => {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }

  return (
    <AssistantMessage
      message={message}
      onComplete={onResearchComplete}
      onWorkflowComplete={onWorkflowComplete}
    />
  );
};

export default ChatMessage;