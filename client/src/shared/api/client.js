import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
export const apiOrigin = apiBaseUrl.replace(/\/api\/v1$/i, '');

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

const statusMessages = {
  401: 'Your session has expired. Sign in again to continue.',
  403: 'You do not have permission to do that.',
  404: 'We couldn’t find what you’re looking for.',
  409: 'This information has changed. Refresh the page and try again.',
  413: 'The selected file is too large. Choose a smaller file and try again.',
  429: 'You’ve made too many requests. Please wait a moment and try again.',
};

const technicalMessage = /network error|non-\d+ status code|status code \d{3}|timeout|\bECONN|\bERR_NETWORK|fetch failed/i;

export function friendlyErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ERR_CANCELED') return '';
  if (!error?.response && (error?.request || technicalMessage.test(error?.message || ''))) {
    return 'We couldn’t connect to the service. Check your connection and try again.';
  }
  const status = error?.response?.status ?? error?.status;
  if (status >= 500) return 'We’re having trouble completing your request. Please try again shortly.';
  const message = error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message;
  if (status === 400 || status === 422) {
    if (typeof message === 'string' && message.trim() && !technicalMessage.test(message)
      && !/^(validation failed|bad request)$/i.test(message.trim())) return message;
    return 'Please check the information and try again.';
  }
  if (statusMessages[status]) return statusMessages[status];
  if (typeof message === 'string' && message.trim() && !technicalMessage.test(message)) {
    return message;
  }
  return fallback;
}

apiClient.interceptors.response.use(
  (response) => response,
  (axiosError) => {
    const response = axiosError.response;
    if (!response && axiosError.code !== 'ERR_CANCELED' && typeof window !== 'undefined') window.dispatchEvent(new Event('app:network-error'));
    const requestPath = axiosError.config?.url || '';
    const isAuthSubmission = /\/auth\/(login|register)$/.test(requestPath);
    if (response?.status === 401 && !isAuthSubmission && typeof window !== 'undefined') {
      const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
      const isPublicPath = publicPaths.includes(window.location.pathname);
      if (!isPublicPath || !/\/auth\/me$/.test(requestPath)) {
        window.dispatchEvent(new Event('app:unauthorized'));
      }
    }
    const payload = response?.data;
    const error = new Error(friendlyErrorMessage({
      response,
      request: axiosError.request,
      code: axiosError.code,
      status: axiosError.status,
      message: payload?.error?.message || payload?.message || axiosError.message,
    }));
    error.status = response?.status;
    error.code = payload?.error?.code || payload?.code;
    error.details = payload?.error?.details;
    error.data = payload;
    return Promise.reject(error);
  },
);
