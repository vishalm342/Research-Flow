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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">ResearchFlow</h1>
        <p className="text-zinc-400 mb-6">AI-powered multi-agent research assistant</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Research topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The impact of AI on healthcare in 2025"
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder-zinc-600"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Research depth
            </label>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              disabled={loading}
            >
              {DEPTH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-zinc-900 text-zinc-100">{o.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/60 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-600/20"
          >
            {loading ? 'Starting…' : 'Start Research'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
