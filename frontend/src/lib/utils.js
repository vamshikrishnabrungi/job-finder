import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Force HTTPS in production
const API_URL_SAFE = API_URL.replace('http://', 'https://');

// Debug: Log the API URL
console.log('API_URL configured:', API_URL_SAFE);

export { API_URL_SAFE as API_URL };

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getMatchScoreColor = (score) => {
  if (score >= 80) return 'match-excellent';
  if (score >= 60) return 'match-good';
  if (score >= 40) return 'match-fair';
  return 'match-low';
};

export const getStatusColor = (status) => {
  const colors = {
    new: 'status-new',
    saved: 'status-saved',
    applied: 'status-applied',
    rejected: 'status-rejected'
  };
  return colors[status] || 'status-new';
};
