import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createResearch } from '../api/research';

const DEPTH_OPTIONS = [
  { value: 'shallow', label: 'Shallow – quick overview' },
  { value: 'medium',  label: 'Medium – balanced (default)' },
  { value: 'deep',    label: 'Deep – comprehensive analysis' },
];

const Home = () => {
  const navigate = useNavigate();
  const [topic, setTopic]   = useState('');
  const [depth, setDepth]   = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await createResearch(topic.trim(), depth);
      navigate(`/research/${data.session_id}`);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to start research. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-4xl font-bold text-indigo-700 mb-2">ResearchFlow</h1>
        <p className="text-gray-500 mb-6">AI-powered multi-agent research assistant</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Research topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The impact of AI on healthcare in 2025"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Research depth
            </label>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={loading}
            >
              {DEPTH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Starting…' : 'Start Research'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
