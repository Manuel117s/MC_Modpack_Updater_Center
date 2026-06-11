const API_BASE_URL = 'http://localhost:8000';

/**
 * Custom error class for API responses that fail with non-2xx statuses.
 */
export class APIError extends Error {
  constructor(status, message, details = null) {
    super(message || `API request failed with status ${status}`);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Core request helper that wraps fetch, handles base URLs, and injects JWT authorization.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set up default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject authentication token if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // 204 No Content has no body
    if (response.status === 204) {
      return null;
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // If unauthorized, clear invalid token
      if (response.status === 401) {
        localStorage.removeItem('token');
      }
      
      const errorMessage = data?.detail || data?.message || response.statusText;
      throw new APIError(response.status, errorMessage, data);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error(error.message || 'Network error occurred');
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};
