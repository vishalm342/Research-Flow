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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/" className="text-indigo-600 underline">← Start new research</Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading report…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-indigo-700 mb-1">{report.topic}</h1>
          <p className="text-sm text-gray-400">
            {report.word_count} words · Generated {formatDate(report.created_at)}
          </p>
          <Link to="/" className="inline-block mt-3 text-indigo-600 text-sm underline">
            ← New research
          </Link>
        </div>

        {/* Report content */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 prose prose-indigo max-w-none">
          <ReactMarkdown>{report.content}</ReactMarkdown>
        </div>

        {/* Sources */}
        {report.sources?.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Sources</h2>
            <ul className="space-y-2">
              {report.sources.map((src, idx) => (
                <li key={idx} className="text-sm">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    {src.title || src.url}
                  </a>
                  {src.snippet && (
                    <p className="text-gray-500 mt-0.5">{src.snippet.slice(0, 160)}…</p>
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
