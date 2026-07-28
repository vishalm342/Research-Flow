import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { API_BASE_URL } from '../utils/constants';

const AGENT_EMOJIS = {
  researcher_primary: '🔍',
  researcher_trends: '🔄',
  writer: '✍️',
  critic: '👁️',
  editor: '✅',
  refiner: '🔧',
  supervisor: '🧠',
  research_merge: '🔗',
  general: '🤖'
};

const WORKFLOW_NODES = [
  { id: 'researcher_primary', name: 'Primary Researcher', emoji: '🔍' },
  { id: 'researcher_trends', name: 'Trends Researcher', emoji: '🔄' },
  { id: 'research_merge', name: 'Merge Data', emoji: '🔗' },
  { id: 'writer', name: 'Writer Agent', emoji: '✍️' },
  { id: 'critic', name: 'Critic Agent', emoji: '👁️' },
  { id: 'editor', name: 'Editor Agent', emoji: '✅' },
  { id: 'supervisor', name: 'Supervisor', emoji: '🧠' },
  { id: 'refiner', name: 'Refiner Agent', emoji: '🔧' }
];

const TerminalLog = ({ sessionId, conversationId, onComplete, onWorkflowComplete }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [logs, setLogs] = useState([]);
  const [workflowDone, setWorkflowDone] = useState(false);
  const terminalRef = useRef(null);

  const [nodeStatuses, setNodeStatuses] = useState({
    researcher_primary: 'idle',
    researcher_trends: 'idle',
    research_merge: 'idle',
    writer: 'idle',
    critic: 'idle',
    editor: 'idle',
    supervisor: 'idle',
    refiner: 'idle'
  });

  const callbacksRef = useRef({ onComplete, onWorkflowComplete });
  useEffect(() => {
    callbacksRef.current = { onComplete, onWorkflowComplete };
  }, [onComplete, onWorkflowComplete]);

  useEffect(() => {
    if (!sessionId) return;
    
    // auto expand begin
    setLogs(['🚀 Starting research workflow...']);
    
    // Connect to SSE stream
    const eventSource = new EventSource(`${API_BASE_URL}/api/status/${sessionId}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setLogs(prev => [...prev, `❌ Error: ${data.error}`]);
          eventSource.close();
          return;
        }

        // Handle simple status updates (fallback)
        if (data.status && !data.agent_name) {
          if (data.status === 'completed' || data.status === 'complete') {
            setNodeStatuses(prev => {
              const updated = { ...prev };
              Object.keys(updated).forEach(k => {
                updated[k] = 'complete';
              });
              return updated;
            });
            setLogs(prev => [...prev, '✅ Research workflow complete!']);
            if (data.report_id) {
               setLogs(prev => [...prev, `📄 Report ID: ${data.report_id}`]);
            }
            setWorkflowDone(true);
            setTimeout(() => callbacksRef.current.onWorkflowComplete?.(sessionId, conversationId), 1000);
            setTimeout(() => callbacksRef.current.onComplete?.(), 2000);
            eventSource.close();
          } else if (data.status === 'failed') {
            setLogs(prev => [...prev, `❌ Workflow failed`]);
            eventSource.close();
          }
          return;
        }

        // Handle specific agent events
        if (data.agent_name && data.status) {
          setNodeStatuses(prev => ({
            ...prev,
            [data.agent_name]: data.status
          }));

          const emoji = AGENT_EMOJIS[data.agent_name] || AGENT_EMOJIS.general;
          const agentNameDisplay = data.agent_name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          let logStr = `${emoji} ${agentNameDisplay}: ${data.message || data.status}`;
          
          setLogs(prev => {
            const newLogs = [...prev];
            if (newLogs.length > 0 && newLogs[newLogs.length-1].includes(`${agentNameDisplay}:`)) {
               newLogs.push(`   └─ ${data.message || data.status}`);
            } else {
               newLogs.push(logStr);
            }
            return newLogs;
          });
        }
        
        if (data.status === 'failed') {
          setLogs(prev => [...prev, '❌ Workflow failed']);
          setWorkflowDone(true);
          eventSource.close();
          setTimeout(() => callbacksRef.current.onComplete?.(), 500);
          return;
        }
        
      } catch (err) {
        console.error('Error parsing SSE data', err);
      }
    };

    eventSource.onerror = (err) => {
       console.error("SSE Error:", err);
       eventSource.close();
    };

    // Cleanup
    return () => {
      eventSource.close();
    };
  }, [sessionId, conversationId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl rounded-tl-sm overflow-hidden shadow-sm w-full transition-all duration-300">
      <div
        className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50 cursor-pointer hover:bg-zinc-800/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-emerald-500" />
          <span className="text-sm font-semibold text-zinc-300">
            Research Workflow & Agent Terminal
            {workflowDone && <span className="ml-2 text-emerald-500">✓ Complete</span>}
          </span>
        </div>
        <button className="text-zinc-400 hover:text-zinc-200 transition-colors">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="flex flex-col">
          {/* Real-time Parallel Node Tracker */}
          <div className="px-4 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {WORKFLOW_NODES.map((node) => {
                const status = nodeStatuses[node.id] || 'idle';
                const isRunning = status === 'running';
                const isComplete = status === 'complete';
                
                return (
                  <div
                    key={node.id}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                      isRunning
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)] scale-[1.02]'
                        : isComplete
                        ? 'bg-zinc-800/40 border-emerald-500/30 opacity-90'
                        : 'bg-zinc-800/10 border-zinc-800/50 opacity-40'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-lg ${
                      isRunning ? 'animate-pulse scale-110' : ''
                    }`}>
                      {node.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate leading-tight">
                        {node.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isRunning
                            ? 'bg-emerald-400 animate-pulse'
                            : isComplete
                            ? 'bg-emerald-500'
                            : 'bg-zinc-600'
                        }`} />
                        <span className={`text-[10px] font-medium tracking-wide uppercase ${
                          isRunning
                            ? 'text-emerald-400 font-bold'
                            : isComplete
                            ? 'text-emerald-500/80 font-bold'
                            : 'text-zinc-500'
                        }`}>
                          {isRunning ? 'Running' : isComplete ? 'Complete' : 'Idle'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrolling Console/Logs */}
          <div
            ref={terminalRef}
            className="max-h-56 overflow-y-auto bg-black/50 px-4 py-3 font-mono text-xs text-zinc-300 space-y-1"
          >
            {logs.length === 0 ? (
              <div className="text-zinc-500">Connecting to agent stream...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className={`${log.includes('└─') ? 'text-zinc-400 pl-4' : 'text-zinc-300'} leading-relaxed`}>
                  {log}
                </div>
              ))
            )}
            {!workflowDone && logs.length > 0 && (
              <div className="animate-pulse text-emerald-500 mt-2">▌</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalLog;
