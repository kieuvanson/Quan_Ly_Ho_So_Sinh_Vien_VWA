import axios from 'axios'
import { authStore } from '../lib/authStore'

const BASE_URL = 'http://localhost:8081'

/**
 * Axios instance configured for VWA EduRecords API.
 * - withCredentials: true for HttpOnly cookie support (refresh token)
 * - Request interceptor adds Authorization header with access token
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor: attach access token to all authenticated requests.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = authStore.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)
