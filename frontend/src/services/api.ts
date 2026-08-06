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

export type StudentEntryMode = 'REGULAR' | 'LATERAL_DIPLOMA';
export type StudentGender = 'FEMALE' | 'MALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | '';
export type StudentStatus = 'ACTIVE' | 'ALUMNI' | 'EXTENDED' | 'GRADUATED';
export type BoardType = '12TH' | 'DIPLOMA' | '';

export interface StudentAcademicHistory {
  tenth_percentage: string | null;
  tenth_year_of_passing: number | null;
  tenth_board: string;
  twelfth_or_diploma_type: BoardType;
  twelfth_or_diploma_percentage: string | null;
  twelfth_or_diploma_year_of_passing: number | null;
  twelfth_board: string;
  btech_sem1_sgpi: string | null;
  btech_sem2_sgpi: string | null;
  btech_sem3_sgpi: string | null;
  btech_sem4_sgpi: string | null;
  se_cgpi: string | null;
  se_percentage: string | null;
  live_kt: number;
  dead_kt: number;
  drop_count: number;
  gap_count: number;
  courses_done_text: string;
  internships_text: string;
}

export interface StudentCompliance {
  aadhaar_number: string;
  pan_number: string;
}

export interface StudentProfile {
  id: number;
  linked_user_id: number | null;
  full_name: string;
  email: string;
  college_roll_no: string;
  admission_year: number;
  entry_mode: StudentEntryMode;
  program_duration_years: number;
  expected_graduation_year: number;
  current_academic_year: number | StudentStatus;
  status: StudentStatus;
  student_whatsapp_number: string;
  parent_whatsapp_number: string;
  parent_email: string;
  date_of_birth: string | null;
  gender: StudentGender;
  nationality: string;
  residential_address: string;
  residential_city: string;
  pin_code: string;
  native_place: string;
  current_location: string;
  branch: string;
  major_minor_subject: string;
  division: string;
  batch: string;
  is_active: boolean;
  academic_history?: StudentAcademicHistory | null;
  compliance?: StudentCompliance | null;
  created_at: string;
  updated_at: string;
}

// Resolve dynamic base URL for cross-device mobile support
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  // If accessing on local network IP (e.g. from a mobile phone), dynamically use the host IP!
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8000/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
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
  updateMe: (data: Partial<Pick<AuthUser, 'username' | 'first_name' | 'last_name'>>) =>
    api.patch<AuthUser>('/auth/me/', data),
  changePassword: (data: { current_password: string; new_password: string; confirm_password: string }) =>
    api.post('/auth/change-password/', data),
  users: () => api.get<AuthUser[]>('/auth/users/'),
  updateUser: (
    userId: number,
    data: Partial<Pick<AuthUser, 'username' | 'email' | 'first_name' | 'last_name' | 'role' | 'is_active'>>
  ) => api.patch<AuthUser>(`/auth/users/${userId}/`, data),
};

// Students Endpoints
export const studentsAPI = {
  list: (page = 1, search = '') =>
    api.get<PaginatedResponse<StudentProfile>>('/students/', { params: { page, search } }),
  detail: (id: number) => api.get<StudentProfile>(`/students/${id}/`),
  me: () => api.get<StudentProfile>('/students/me/'),
  create: (data: Partial<StudentProfile>) => api.post<StudentProfile>('/students/', data),
  update: (id: number, data: Partial<StudentProfile>) => api.patch<StudentProfile>(`/students/${id}/`, data),
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
};

// Training Endpoints
export const trainingAPI = {
  programs: () =>
    api.get<PaginatedResponse<any>>('/training/programs/'),
  createProgram: (data: any) =>
    api.post('/training/programs/', data),
  lectures: (programId?: number) =>
    api.get<PaginatedResponse<any>>('/training/lectures/', { params: { program_id: programId } }),
  createLecture: (data: any) =>
    api.post('/training/lectures/', data),
  attendance: (lectureId?: number, studentId?: number) =>
    api.get<PaginatedResponse<any>>('/training/attendance/', { params: { lecture_id: lectureId, student_id: studentId } }),
  markAttendance: (data: { lecture_id: number; student_id: number; status: string }) =>
    api.post('/training/attendance/mark/', data),
  batches: () =>
    api.get<PaginatedResponse<any>>('/training/batches/'),
  createBatch: (data: { name: string; is_active?: boolean }) =>
    api.post('/training/batches/', data),
  rollover: () =>
    api.post('/training/rollover/'),
  markAttendanceByRoll: (data: { lecture_id: number; college_roll_no: string; status: string }) =>
    api.post<any>('/training/attendance/mark-by-roll/', data),
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
