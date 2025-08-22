// Centralized API base URL and fetch helper
// Uses Vite env, CRA env, or falls back to same-origin
export const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export const apiFetch = (path, options = {}) => {
  const base = API_URL || '';
  // Ensure path starts with '/'
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return fetch(`${base}${normalized}`, options);
};