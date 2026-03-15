import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { getResearchStatus } from '../api/research';

const AGENT_EMOJIS = {
  researcher: '🔍',
  writer: '✍️',
  editor: '✅',
  refiner: '🔧',
};

const TerminalLog = ({ sessionId, onComplete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);
  const terminalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const completedFiredRef = useRef(false); // guard: fire onComplete exactly once

  useEffect(() => {
    const pollLogs = async () => {
      try {
        const statusData = await getResearchStatus(sessionId);
        setStatus(statusData);

        // Build log entries from status
        const newLogs = [];

        if (statusData.status === 'pending') {
          newLogs.push('🚀 Initializing research workflow...');
        }

        if (statusData.current_agent === 'researcher') {
          newLogs.push(`${AGENT_EMOJIS.researcher} Researcher Agent: Searching web and scraping sources...`);
          newLogs.push(`   Progress: ${statusData.progress}%`);
        }

        if (statusData.status === 'researcher_complete' || statusData.current_agent === 'writer') {
          newLogs.push(`${AGENT_EMOJIS.researcher} Researcher Agent: ✓ Complete`);
          if (statusData.current_agent === 'writer') {
            newLogs.push(`${AGENT_EMOJIS.writer} Writer Agent: Generating draft report...`);
            newLogs.push(`   Progress: ${statusData.progress}%`);
          }
        }

        if (statusData.status === 'writer_complete' || statusData.current_agent === 'editor') {
          newLogs.push(`${AGENT_EMOJIS.writer} Writer Agent: ✓ Complete`);
          if (statusData.current_agent === 'editor') {
            newLogs.push(`${AGENT_EMOJIS.editor} Editor Agent: Reviewing and polishing...`);
            newLogs.push(`   Progress: ${statusData.progress}%`);
          }
        }

        if (statusData.current_agent === 'refiner') {
          newLogs.push(`${AGENT_EMOJIS.editor} Editor Agent: ✓ Complete`);
          newLogs.push(`${AGENT_EMOJIS.refiner} Refiner Agent: Applying refinements...`);
          newLogs.push(`   Progress: ${statusData.progress}%`);
        }

        if (statusData.status === 'complete') {
          newLogs.push(`${AGENT_EMOJIS.editor} Editor Agent: ✓ Complete`);
          newLogs.push('✅ Research workflow complete!');
          newLogs.push(`📄 Report ID: ${statusData.report_id}`);
          clearInterval(pollIntervalRef.current);

          // Fire onComplete exactly once
          if (!completedFiredRef.current) {
            completedFiredRef.current = true;
            onComplete?.();
          }
        }

        if (statusData.status === 'failed') {
          newLogs.push(`❌ Workflow failed: ${statusData.error_message || 'Unknown error'}`);
          clearInterval(pollIntervalRef.current);
        }

        setLogs(newLogs);

        // Auto-scroll when expanded
        if (isExpanded && terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      } catch (err) {
        console.error('Failed to fetch research status:', err);
      }
    };

    completedFiredRef.current = false; // reset if sessionId changes
    pollLogs();
    pollIntervalRef.current = setInterval(pollLogs, 2000);

    return () => {
      clearInterval(pollIntervalRef.current);
    };
  }, [sessionId]); // isExpanded intentionally omitted to avoid restarting poll

  // Separate effect just for auto-scrolling when expanded state changes
  useEffect(() => {
    if (isExpanded && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [isExpanded, logs]);

  const isComplete = status?.status === 'complete' || status?.status === 'failed';

  return (
    <div className="flex flex-col gap-3 mt-2">
      {/* Sleek Accordion Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          flex items-center gap-3 text-sm text-indigo-400
          bg-indigo-500/10 border border-indigo-500/20
          px-4 py-3 rounded-xl cursor-pointer
          hover:bg-indigo-500/20 transition-all w-fit shadow-sm
        "
      >
        <Terminal size={16} />
        <span className="font-medium tracking-wide">
          {isComplete
            ? '✓ Agent Workflow Complete'
            : '⚙️ Orchestrating LangGraph Agents...'}
        </span>
        {status && !isComplete && (
          <span className="text-xs opacity-70">
            {status.progress}%
          </span>
        )}
        <div className="ml-2 text-indigo-400/70">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Terminal Window */}
      {isExpanded && (
        <div
          ref={terminalRef}
          className="
            bg-black border border-slate-700/80 rounded-xl
            text-green-400 text-xs font-mono p-4 h-60
            overflow-y-auto scrollbar-thin shadow-2xl w-full max-w-3xl
          "
        >
          {logs.length === 0 ? (
            <p className="text-green-500/50">Waiting for logs...</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="mb-1 leading-relaxed">
                <span className="text-green-500/70">{'> '}</span>
                {log}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TerminalLog;