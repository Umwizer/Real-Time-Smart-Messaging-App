export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  profilePicture?: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
}