// Central API service — all backend calls go through here
import { auth } from '../config/firebase';
import { Platform } from 'react-native';

// Use laptop IP for Expo Go (mobile), localhost for web browser
const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : 'http://192.168.0.13:8000';

// Get Firebase token for authenticated requests
const getAuthHeader = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return { Authorization: 'Bearer dev_token' };
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return { Authorization: 'Bearer dev_token' };
  }
};

// Generic request helper
const request = async (method, endpoint, body = null) => {
  const headers = await getAuthHeader();
  headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      // Throw a proper Error object with message string
      const detail = data?.detail || data?.message || `Request failed with status ${response.status}`;
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    return data;
  } catch (err) {
    // Network error (backend not running etc)
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure the backend is running on localhost:8000');
    }
    throw err;
  }
};

// ── Auth ──────────────────────────────────────────────────
export const registerUser = (payload) =>
  request('POST', '/auth/register', payload);

export const getMe = () =>
  request('GET', '/auth/me');

export const getTokenBalance = () =>
  request('GET', '/auth/tokens');

// ── Designs ───────────────────────────────────────────────
export const saveDesign = (payload) =>
  request('POST', '/designs/save', payload);

export const getMyDesigns = () =>
  request('GET', '/designs/my');

export const getDesignById = (id) =>
  request('GET', `/designs/${id}`);

export const deleteDesign = (id) =>
  request('DELETE', `/designs/${id}`);

// ── AI Prompt ─────────────────────────────────────────────
export const parsePrompt = (prompt) =>
  request('POST', '/prompt/parse', { prompt });

export const getPromptSuggestions = () =>
  request('GET', '/prompt/suggestions');

// ── 3D Models ─────────────────────────────────────────────
export const generateModel = (designId, rooms) =>
  request('POST', '/models/generate', { design_id: designId, rooms });

export const getModelUrl = (fileName) =>
  `${BASE_URL}/models/file/${fileName}`;

export const getSampleModelUrl = (name) =>
  `${BASE_URL}/models/sample/${name}`;
