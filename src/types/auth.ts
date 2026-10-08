export interface User {
  id: string
  username: string
  email: string
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  username: string
}