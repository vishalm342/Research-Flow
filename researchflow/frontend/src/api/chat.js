import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Create a new conversation.
 * @returns {Promise<{ conversation_id, user_session, title, created_at, updated_at, message_count, status }>}
 */
export const createConversation = async () => {
  const response = await api.post('/api/conversations');
  return response.data;
};

/**
 * Get all conversations, ordered by most recently updated.
 * @returns {Promise<Array<{ conversation_id, title, updated_at, created_at, message_count }>>}
 */
export const getConversations = async () => {
  const response = await api.get('/api/conversations');
  return response.data;
};

/**
 * Get all messages in a conversation.
 * @param {string} conversationId
 * @returns {Promise<Array<{ message_id, conversation_id, role, content, created_at, metadata }>>}
 */
export const getMessages = async (conversationId) => {
  const response = await api.get(`/api/conversations/${conversationId}/messages`);
  return response.data;
};

/**
 * Send a message to a conversation.
 * @param {string} conversationId
 * @param {string} content - The message text
 * @param {boolean} triggerResearch - Whether to start a research workflow
 * @param {string|null} refinementQuery - Optional refinement instruction
 * @returns {Promise<{ message_id, conversation_id, role, content, created_at, metadata }>}
 */
export const sendMessage = async (
  conversationId,
  content,
  triggerResearch = false,
  refinementQuery = null
) => {
  const response = await api.post(`/api/conversations/${conversationId}/messages`, {
    content,
    trigger_research: triggerResearch,
    refinement_query: refinementQuery,
  });
  return response.data;
};

/**
 * Delete a conversation.
 * @param {string} conversationId 
 */
export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/api/conversations/${conversationId}`);
  return response.data;
};

/**
 * Update conversation metadata (e.g. title, pinned status).
 * @param {string} conversationId 
 * @param {Object} data - { title?: string, is_pinned?: boolean }
 */
export const updateConversation = async (conversationId, data) => {
  const response = await api.patch(`/api/conversations/${conversationId}`, data);
  return response.data;
};

/**
 * Cleanup empty conversations (message_count == 0).
 */
export const cleanupEmptyConversations = async () => {
  const response = await api.delete('/api/conversations/cleanup/empty');
  return response.data;
};

/**
 * Get research status by session ID.
 * @param {string} sessionId
 * @returns {Promise<{ session_id, status, progress, current_agent, report_id, error_message }>}
 */
export const getResearchStatus = async (sessionId) => {
  const response = await api.get(`/api/status/${sessionId}`);
  return response.data;
};