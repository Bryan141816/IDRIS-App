import React from 'react';
import { API } from './Axio_API_Handler';


API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const fetchData = <T>(url: string, setState: React.Dispatch<React.SetStateAction<T | null>>) => {
  API.get(url).then(res => setState(res.data))
    .catch(err => console.error('Error fetching', err));
}


