import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// API Response Types
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: 'SUPER_ADMIN' | 'TPO' | 'HOD' | 'VOLUNTEER' | 'STUDENT';
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Add JWT token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor - Handle token refresh on 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token available, redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login/', { email, password }),
  logout: () => api.post('/auth/logout/'),
  refreshToken: (refresh: string) =>
    api.post('/auth/token/refresh/', { refresh }),
  me: () => api.get<AuthUser>('/auth/me/'),
  users: () => api.get<AuthUser[]>('/auth/users/'),
};

// Students Endpoints
export const studentsAPI = {
  list: (page = 1) =>
    api.get<PaginatedResponse<any>>('/students/', { params: { page } }),
  detail: (id: number) => api.get(`/students/${id}/`),
  create: (data: any) => api.post('/students/', data),
  update: (id: number, data: any) => api.put(`/students/${id}/`, data),
  delete: (id: number) => api.delete(`/students/${id}/`),
};

// Placements Endpoints
export const placementsAPI = {
  opportunities: (page = 1) =>
    api.get<PaginatedResponse<any>>('/placements/opportunities/', {
      params: { page },
    }),
  applications: (page = 1) =>
    api.get<PaginatedResponse<any>>('/placements/applications/', {
      params: { page },
    }),
  createApplication: (data: any) =>
    api.post('/placements/applications/', data),
  updateApplication: (id: number, data: any) =>
    api.put(`/placements/applications/${id}/`, data),
};

// Training Endpoints
export const trainingAPI = {
  programs: (page = 1) =>
    api.get<PaginatedResponse<any>>('/training/programs/', { params: { page } }),
  enrollment: (page = 1) =>
    api.get<PaginatedResponse<any>>('/training/enrollment/', {
      params: { page },
    }),
  createEnrollment: (data: any) =>
    api.post('/training/enrollment/', data),
};

// Events Endpoints
export const eventsAPI = {
  list: (page = 1) =>
    api.get<PaginatedResponse<any>>('/events/', { params: { page } }),
  detail: (id: number) => api.get(`/events/${id}/`),
  attendees: (eventId: number) =>
    api.get(`/events/${eventId}/attendees/`),
  register: (eventId: number) =>
    api.post(`/events/${eventId}/register/`),
};

// Communications Endpoints
export const communicationsAPI = {
  sendEmail: (data: any) => api.post('/communications/send-email/', data),
  sendSMS: (data: any) => api.post('/communications/send-sms/', data),
  notifications: (page = 1) =>
    api.get<PaginatedResponse<any>>('/communications/notifications/', {
      params: { page },
    }),
};

// Analytics Endpoints
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard/'),
  placements: () => api.get('/analytics/placements/'),
  students: () => api.get('/analytics/students/'),
  training: () => api.get('/analytics/training/'),
};

// Common/Reference Data Endpoints
export const commonAPI = {
  academicYears: () => api.get('/common/academic-years/'),
  branches: () => api.get('/common/branches/'),
  divisions: () => api.get('/common/divisions/'),
  batches: () => api.get('/common/batches/'),
  companies: () => api.get('/common/companies/'),
  jobRoles: () => api.get('/common/job-roles/'),
  roles: () => api.get('/common/roles/'),
};

export default api;
