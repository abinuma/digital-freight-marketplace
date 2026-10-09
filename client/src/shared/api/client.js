import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
export const apiOrigin = apiBaseUrl.replace(/\/api\/v1$/i, '');

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (axiosError) => {
    const response = axiosError.response;
    const payload = response?.data;
    const error = new Error(
      payload?.error?.message || payload?.message || axiosError.message || 'The request could not be completed',
    );
    error.status = response?.status;
    error.code = payload?.error?.code || payload?.code;
    error.details = payload?.error?.details;
    error.data = payload;
    return Promise.reject(error);
  },
);
