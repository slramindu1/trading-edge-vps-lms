// lib/types/auth.ts
export interface User {
  id: string;
  email: string;
  fname: string;
  lname: string;
  user_type_id: number;
  profile_completed: boolean;
  mobile?: string;
  aboutMe?: string;
  gender_id?: number;
  student_type?: string;
  status_id: number;
  password?: string;
  verification_code?: string;
  reset_token_expiry?: Date;
  joined_date: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fname: string;
  lname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileUpdateData {
  mobile: string;
  aboutMe?: string;
  gender_id: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}


export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}