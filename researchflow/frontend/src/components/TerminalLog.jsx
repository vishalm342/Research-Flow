import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Terminal,
  Search,
  PenLine,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
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
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          flex items-center gap-3 text-sm text-zinc-400
          bg-zinc-900 border border-zinc-800
          px-4 py-3 rounded-xl cursor-pointer
          hover:bg-zinc-800/80 transition-all w-fit shadow-sm
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
        <div className="ml-2 text-zinc-500">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div
          ref={terminalRef}
          className="
            bg-zinc-950 border border-zinc-800 rounded-xl
            p-3 md:p-4 overflow-y-auto shadow-2xl w-full max-w-3xl
            space-y-2
          "
        >
          {[
            {
              key: 'researcher',
              name: 'Researcher',
              Icon: Search,
              active: status?.current_agent === 'researcher',
              done: status?.status === 'researcher_complete'
                || status?.current_agent === 'writer'
                || status?.current_agent === 'editor'
                || status?.current_agent === 'refiner'
                || status?.status === 'complete',
              activeText: 'Searching the web...',
            },
            {
              key: 'writer',
              name: 'Writer',
              Icon: PenLine,
              active: status?.current_agent === 'writer',
              done: status?.status === 'writer_complete'
                || status?.current_agent === 'editor'
                || status?.current_agent === 'refiner'
                || status?.status === 'complete',
              activeText: 'Writing draft...',
            },
            {
              key: 'editor',
              name: 'Editor',
              Icon: CheckCircle2,
              active: status?.current_agent === 'editor',
              done: status?.current_agent === 'refiner' || status?.status === 'complete',
              activeText: 'Reviewing draft...',
            },
            {
              key: 'refiner',
              name: 'Refiner',
              Icon: Wand2,
              active: status?.current_agent === 'refiner',
              done: status?.status === 'complete',
              activeText: 'Applying refinements...',
            },
          ].map((agent) => {
            const rowState = agent.active ? 'active' : agent.done ? 'done' : 'pending';
            const rowClasses = rowState === 'active'
              ? 'bg-emerald-500/10 border border-emerald-500/30 rounded-xl'
              : rowState === 'done'
                ? 'bg-zinc-900 border border-zinc-800 rounded-xl'
                : 'bg-zinc-950 border border-zinc-800/50 rounded-xl';

            const iconClasses = rowState === 'active'
              ? 'text-emerald-400'
              : rowState === 'done'
                ? 'text-zinc-400'
                : 'text-zinc-600';

            const titleClasses = rowState === 'active'
              ? 'text-zinc-100'
              : rowState === 'done'
                ? 'text-zinc-200'
                : 'text-zinc-500';

            const statusClasses = rowState === 'active'
              ? 'text-emerald-300'
              : rowState === 'done'
                ? 'text-zinc-500'
                : 'text-zinc-600';

            const statusText = rowState === 'active'
              ? agent.activeText
              : rowState === 'done'
                ? 'Complete'
                : 'Waiting...';

            return (
              <div key={agent.key} className={`p-3 ${rowClasses}`}>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-lg border border-zinc-800 bg-zinc-900/70 flex items-center justify-center">
                      <agent.Icon size={16} className={iconClasses} />
                    </div>
                    {rowState === 'done' && (
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${titleClasses}`}>{agent.name}</p>
                    <p className={`text-xs mt-0.5 ${statusClasses}`}>{statusText}</p>
                  </div>

                  <div className="w-24 shrink-0">
                    {rowState === 'active' && (
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full w-2/3 bg-emerald-500 animate-pulse rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TerminalLog;
