
// src/api/auth.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

export async function getReportList (): Promise<any> {
  const response = await API.get('/report_list');
  console.log(response.data)
  return response.data;
}
