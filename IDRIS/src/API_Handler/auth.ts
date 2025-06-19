// src/api/auth.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export async function loginUser(email: string, password: string): Promise<string> {
  const response = await API.post('/login', {
    email,
    password,
  });
  const token: string = response.data.access_token;
  localStorage.setItem('token', token);
  return token;
}


export async function fetchCurrentUser(): Promise<any> {
  const response = await API.get('/users/me');
  return response.data;
}

export function logoutUser(): void {
  localStorage.removeItem('token');
}

