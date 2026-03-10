import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Start a new research session (legacy standalone endpoint).
 * @param {string} topic
 * @param {string} depth - 'shallow' | 'medium' | 'deep'
 * @returns {Promise<{ session_id: string, status: string, message: string }>}
 */
export const createResearch = async (topic, depth = 'medium') => {
  const response = await api.post('/api/research', { topic, depth });
  return response.data;
};

/**
 * Poll the status of an ongoing or finished research session.
 * @param {string} sessionId
 * @returns {Promise<{ session_id, status, progress, current_agent, report_id, error_message }>}
 */
export const getResearchStatus = async (sessionId) => {
  const response = await api.get(`/api/status/${sessionId}`);
  return response.data;
};

/**
 * Fetch a completed report by its ID.
 * @param {string} reportId
 * @returns {Promise<{ report_id, session_id, topic, content, sources, word_count, created_at }>}
 */
export const getReport = async (reportId) => {
  const response = await api.get(`/api/report/${reportId}`);
  return response.data;
};
