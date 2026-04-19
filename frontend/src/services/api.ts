import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          `${API_URL}/api/${API_VERSION}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register/', data),
  login: (data: any) => apiClient.post('/auth/login/', data),
  me: () => apiClient.get('/auth/me/'),
  changePassword: (data: any) => apiClient.post('/auth/change-password/', data),
};

// Students endpoints
export const studentsAPI = {
  list: (params?: any) => apiClient.get('/students/', { params }),
  get: (id: string) => apiClient.get(`/students/${id}/`),
  create: (data: any) => apiClient.post('/students/', data),
  update: (id: string, data: any) => apiClient.patch(`/students/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/students/${id}/`),
};

// Placements endpoints
export const placementsAPI = {
  listOpportunities: (params?: any) => apiClient.get('/placements/opportunities/', { params }),
  getOpportunity: (id: string) => apiClient.get(`/placements/opportunities/${id}/`),
  createOpportunity: (data: any) => apiClient.post('/placements/opportunities/', data),
  listApplications: (params?: any) => apiClient.get('/placements/applications/', { params }),
  applyToOpportunity: (opportunityId: string, data: any) =>
    apiClient.post(`/placements/opportunities/${opportunityId}/apply/`, data),
};

// Training endpoints
export const trainingAPI = {
  listPrograms: (params?: any) => apiClient.get('/training/programs/', { params }),
  getProgram: (id: string) => apiClient.get(`/training/programs/${id}/`),
  listSlots: (params?: any) => apiClient.get('/training/slots/', { params }),
};

// Events endpoints
export const eventsAPI = {
  list: (params?: any) => apiClient.get('/events/', { params }),
  get: (id: string) => apiClient.get(`/events/${id}/`),
  enroll: (id: string, data: any) => apiClient.post(`/events/${id}/enroll/`, data),
};

// Analytics endpoints
export const analyticsAPI = {
  placementAnalytics: (params?: any) => apiClient.get('/analytics/placements/', { params }),
  trainingAnalytics: (params?: any) => apiClient.get('/analytics/training/', { params }),
  attendanceAnalytics: (params?: any) => apiClient.get('/analytics/attendance/', { params }),
};

// Common endpoints
export const commonAPI = {
  getAcademicYears: () => apiClient.get('/common/academic-years/'),
  getBranches: () => apiClient.get('/common/branches/'),
  getCompanies: () => apiClient.get('/common/companies/'),
};

export default apiClient;
