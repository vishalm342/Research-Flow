import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResearchStatus } from '../api/research';

const AGENT_LABELS = {
  researcher: '🔍 Researcher',
  writer:     '✍️  Writer',
  editor:     '✅ Editor',
};

const STATUS_MESSAGES = {
  pending:            'Queued – waiting to start…',
  researcher_running: 'Searching the web and scraping sources…',
  researcher_complete:'Web research complete.',
  writer_running:     'Writing the draft report…',
  writer_complete:    'Draft report ready.',
  editor_running:     'Reviewing and polishing the report…',
  complete:           'Research complete! Redirecting to your report…',
  failed:             'Research failed.',
};

const Research = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus]   = useState(null);
  const [error, setError]     = useState(null);
  const intervalRef = useRef(null);

  const poll = async () => {
    try {
      const data = await getResearchStatus(sessionId);
      setStatus(data);

      if (data.status === 'complete' && data.report_id) {
        clearInterval(intervalRef.current);
        setTimeout(() => navigate(`/report/${data.report_id}`), 1200);
      } else if (data.status === 'failed') {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not fetch status.');
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    poll(); // immediate first fetch
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current);
  }, [sessionId]); // eslint-disable-line

  const progress = status?.progress ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg text-center">
        <h2 className="text-2xl font-bold text-indigo-700 mb-2">Research in Progress</h2>
        <p className="text-gray-500 text-sm mb-6 font-mono">{sessionId}</p>

        {error ? (
          <p className="text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
        ) : (
          <>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
              <div
                className="bg-indigo-500 h-4 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">{progress}% complete</p>

            {/* Current agent */}
            {status?.current_agent && (
              <p className="text-indigo-600 font-medium mb-2">
                {AGENT_LABELS[status.current_agent] ?? status.current_agent}
              </p>
            )}

            {/* Status message */}
            <p className="text-gray-500 text-sm">
              {STATUS_MESSAGES[status?.status] ?? (status?.status ?? 'Initialising…')}
            </p>

            {/* Error from server */}
            {status?.error_message && (
              <p className="mt-4 text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">
                {status.error_message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Research;
