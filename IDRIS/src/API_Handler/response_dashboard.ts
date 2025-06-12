import React from 'react';
import { API } from './Axio_API_Handler';


export const fetchData = <T>(url: string, setState: React.Dispatch<React.SetStateAction<T | null>>) => {
  API.get(url).then(res => setState(res.data))
    .catch(err => console.error('Error fetching', err));

}


