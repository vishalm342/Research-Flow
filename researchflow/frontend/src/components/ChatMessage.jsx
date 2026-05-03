import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, Copy, Edit2, Check } from 'lucide-react';
import TerminalLog from './TerminalLog';
import { getMessages } from '../api/chat';

const ChatMessage = ({ message, onResearchComplete, onWorkflowComplete, onEdit }) => {
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

  // Show completed report with download button
  if (isReportComplete) {
    const handleDownloadPDF = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/reports/${metadata.report_id}/export?format=pdf`);
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
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-700/50">
              <h3 className="text-sm font-semibold text-zinc-300">📄 Research Report</h3>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-all"
              >
                <Download size={14} />
                PDF
              </button>
            </div>

            <div className="prose prose-invert prose-zinc max-w-full w-full text-left prose-headings:text-zinc-100 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-emerald-400 prose-strong:text-zinc-200 prose-p:text-zinc-300 prose-p:leading-relaxed text-[15px]">
              <ReactMarkdown>{formatContent(message.content)}</ReactMarkdown>
            </div>
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

export default ChatMessage;