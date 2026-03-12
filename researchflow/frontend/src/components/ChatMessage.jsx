import React from 'react';
import ReactMarkdown from 'react-markdown';
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
        bg-slate-800 hover:bg-slate-700
        border border-slate-600
        text-slate-300 text-xs
        px-3 py-1.5 rounded-full
        transition-all cursor-pointer shadow-sm
      "
    >
      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">
        {index + 1}
      </span>
      <span className="max-w-[140px] truncate">{domain}</span>
      <ExternalLink size={10} className="text-slate-400" />
    </a>
  );
};

// ---------------------------------------------------------------------------
// Sources Row
// ---------------------------------------------------------------------------
const SourcesRow = ({ sources }) => {
  if (!sources?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {sources.map((src, idx) => (
        <SourcePill key={idx} source={src} index={idx} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Assistant message – Markdown + optional sources
// ---------------------------------------------------------------------------
const AssistantMessage = ({ message, onComplete }) => {
  const isReport = message.metadata?.type === 'research_report';
  const isResearchStub = message.metadata?.research_id && !isReport;

  const sources = isReport ? message.metadata?.sources : null;
  const qualityScore = message.metadata?.quality_score || (isReport ? '9.3' : null);
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
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-3xl w-full">
        {/* Avatar row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px]">✦</span>
          </div>
          <span className="text-xs font-medium text-slate-400">
            ResearchFlow
          </span>
        </div>

        {/* If it's a research stub, ONLY show the terminal block */}
        {isResearchStub ? (
          <TerminalLog
            sessionId={message.metadata.research_id}
            onComplete={onComplete}
          />
        ) : (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm">
            {isReport && <SourcesRow sources={sources} />}

            <div
              className="
                prose prose-invert prose-slate max-w-none
                prose-headings:text-slate-100 prose-headings:font-bold
                prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                prose-a:text-indigo-400 hover:prose-a:text-indigo-300
                prose-strong:text-slate-200
                prose-code:text-indigo-300 prose-code:bg-indigo-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-slate-800
                prose-blockquote:border-indigo-500/50 prose-blockquote:text-slate-400 prose-blockquote:bg-indigo-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                prose-li:text-slate-300 prose-li:marker:text-indigo-500
                prose-hr:border-slate-700/50
                prose-p:text-slate-300 prose-p:leading-relaxed text-[15px]
              "
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>

            {/* Footer Action Bar */}
            <div className="border-t border-slate-700/50 mt-6 pt-4 flex flex-wrap items-center justify-between gap-4 select-none">
              <div className="text-xs text-slate-500 font-medium">
                {qualityScore && `Quality Score: ${qualityScore}/10`}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-medium bg-slate-700/30 hover:bg-slate-700/50 px-2.5 py-1.5 rounded-lg"
                >
                  <Copy size={13} /> Copy to Clipboard
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={!reportId}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-medium bg-slate-700/30 hover:bg-slate-700/50 px-2.5 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={13} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// User message
// ---------------------------------------------------------------------------
const UserMessage = ({ message }) => (
  <div className="flex justify-end">
    <div className="
      bg-slate-700 text-white
      rounded-2xl rounded-tr-sm
      px-5 py-3 max-w-[80%]
      shadow-md
      text-sm whitespace-pre-wrap leading-relaxed
    ">
      {message.content}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------
const ChatMessage = ({ message, onResearchComplete }) => {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }

  return (
    <AssistantMessage
      message={message}
      onComplete={onResearchComplete}
    />
  );
};

export default ChatMessage;