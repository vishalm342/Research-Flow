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

const TerminalLog = ({ sessionId, onComplete, onWorkflowComplete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);
  const terminalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const completedFiredRef = useRef(false); // guard: fire onComplete exactly once
  const workflowCompleteCalledRef = useRef(false); // guard: fire onWorkflowComplete exactly once

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
          
          if (!workflowCompleteCalledRef.current) {
            workflowCompleteCalledRef.current = true;
            // Trigger the report finalization with 4-second delay
            // Pass sessionId so parent can track which research is being finalized
            onWorkflowComplete?.(sessionId);
          }
          
          if (!completedFiredRef.current) {
            completedFiredRef.current = true;
            setTimeout(() => {
              onComplete?.();
              clearInterval(pollIntervalRef.current);
            }, 1500);
          }
        }

        if (statusData.status === 'failed') {
          newLogs.push(`❌ Workflow failed: ${statusData.error_message || 'Unknown error'}`);
          
          if (!completedFiredRef.current) {
            completedFiredRef.current = true;
            setTimeout(() => {
              onComplete?.();
              clearInterval(pollIntervalRef.current);
            }, 1500);
          }
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
    workflowCompleteCalledRef.current = false; // reset if sessionId changes
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
          px-4 py-3 rounded-md cursor-pointer
          hover:bg-zinc-800 transition-all w-fit shadow-sm
        "
      >
        <Terminal size={16} className={isComplete ? "text-emerald-500" : "text-zinc-500"} />
        <span className="font-medium tracking-tight">
          {isComplete
            ? 'Research workflow complete'
            : 'Processing research workflow...'}
        </span>
        <div className="ml-2 text-zinc-600">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isExpanded && (
        <div
          ref={terminalRef}
          className="
            bg-zinc-900 border border-zinc-800 rounded-lg
            p-2 overflow-y-auto shadow-2xl w-full max-w-3xl
            space-y-1
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
            
            return (
              <div 
                key={agent.key} 
                className={`
                  relative p-3 border-l-2 transition-all duration-300
                  ${rowState === 'active' ? 'bg-emerald-900/20 border-l-emerald-500' : ''}
                  ${rowState === 'done' ? 'bg-zinc-900/40 border-l-emerald-600/50' : ''}
                  ${rowState === 'pending' ? 'bg-zinc-900/20 border-l-zinc-700' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className="shrink-0 h-8 w-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <agent.Icon 
                      size={14} 
                      className={rowState === 'active' ? 'text-emerald-400' : rowState === 'done' ? 'text-emerald-500' : 'text-zinc-600'} 
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${rowState === 'pending' ? 'text-zinc-500' : 'text-zinc-200'}`}>
                        {agent.name}
                      </span>
                      {rowState === 'active' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Running</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {rowState === 'done' && <CheckCircle2 size={10} className="text-zinc-500" />}
                      <span className={`text-[11px] ${
                        rowState === 'active' ? 'text-emerald-400' : 
                        rowState === 'done' ? 'text-zinc-400' : 
                        'text-zinc-500'
                      }`}>
                        {rowState === 'active' ? agent.activeText : rowState === 'done' ? 'Complete' : 'Waiting...'}
                      </span>
                    </div>
                  </div>

                  {rowState === 'active' && (
                    <div className="w-20 shrink-0 hidden sm:block">
                      <div className="h-[2px] w-full bg-zinc-800 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-emerald-500/30" />
                        <div className="absolute inset-0 bg-emerald-500 w-1/2 animate-[shimmer_1.5s_infinite] rounded-full" style={{
                          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Animated shimmer progress bar at the bottom for active card */}
                {rowState === 'active' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full animate-pulse opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-[shimmer_2s_infinite]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TerminalLog;