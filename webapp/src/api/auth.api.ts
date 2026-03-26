import { AutoQueryKey } from '@utils';
import { BaseUrl } from '@config';
import axios from 'axios';
import type { User } from '../lib/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

@AutoQueryKey()
export class AuthApi {
  static me = async () => {
    const response = await axios.get<User>(`${BaseUrl.API}/auth/me`);
    return response.data;
  };

  static login = async (data: LoginPayload) => {
    const response = await axios.post<AuthResponse>(`${BaseUrl.API}/auth/login`, data);
    return response.data;
  };

  static register = async (data: RegisterPayload) => {
    const response = await axios.post<AuthResponse>(`${BaseUrl.API}/auth/register`, data);
    return response.data;
  };

  static logout = async () => {
    const response = await axios.post(`${BaseUrl.API}/auth/logout`);
    return response.data;
  };
}
