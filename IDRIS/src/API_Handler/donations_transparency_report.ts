import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8000',
});



export async function createTransparencyReport(formData: FormData): Promise<any> {
    const response = await API.post('/transparency_report/create/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response;
}

export async function getTransparencyReports(
    search: string = '',
    date: string = '',
    page: number = 1,
    limit: number = 5
):
    Promise<any> {

    const params: any = {};
    if (search) params.file_name = search;
    if (date) params.date = date;
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const response = await API.get('/transparency_report/get_transparency_reports/', { params });
    return response;
}

export async function getTransparencyReportById(id: number): Promise<any> {
    return await API.get('/transparency_report/get_by_id', {
        params: { transparency_id: id },
    });
}

export async function updateTransparencyReport(id: number, formData: FormData): Promise<any> {
    return await API.put(`/transparency_report/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  
  