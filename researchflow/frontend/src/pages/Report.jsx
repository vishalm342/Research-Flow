import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getReport } from '../api/research';
import { formatDate } from '../utils/helpers';

const Report = () => {
  const { id: reportId } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError]  = useState(null);

  useEffect(() => {
    getReport(reportId)
      .then(setReport)
      .catch((err) => setError(err?.response?.data?.detail || 'Failed to load report.'));
  }, [reportId]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/app" className="text-emerald-400 hover:text-emerald-300 underline">← Start new research</Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500">Loading report…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">{report.topic}</h1>
          <p className="text-sm text-zinc-400">
            {report.word_count} words · Generated {formatDate(report.created_at)}
          </p>
          <Link to="/app" className="inline-block mt-3 text-emerald-400 hover:text-emerald-300 text-sm font-medium underline transition-all">
            ← New research
          </Link>
        </div>

        {/* Report content */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 mb-6 prose prose-invert prose-zinc max-w-none prose-headings:text-zinc-100 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-emerald-400 prose-strong:text-zinc-200 prose-p:text-zinc-300 prose-p:leading-relaxed text-[15px]">
          <ReactMarkdown>{report.content}</ReactMarkdown>
        </div>

        {/* Sources */}
        {report.sources?.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold text-zinc-300 mb-3">Sources</h2>
            <ul className="space-y-2">
              {report.sources.map((src, idx) => (
                <li key={idx} className="text-sm">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium transition-all"
                  >
                    {src.title || src.url}
                  </a>
                  {src.snippet && (
                    <p className="text-zinc-500 mt-0.5">{src.snippet.slice(0, 160)}…</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
