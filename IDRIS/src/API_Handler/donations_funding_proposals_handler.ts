
import { API } from './Axio_API_Handler';

export async function getDonorsList(search = ''): Promise<any[]> {
  const response = await API.get(`/donors/get_all_as_lists/`, {
    params: { search }, 
  });
  return response.data;
}

export async function createNewDonor(formData: FormData): Promise<any> {
  const response = await API.post('/donors/create/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function searchDonorUsers(search = ''): Promise<any> {
  const response = await API.get('/users/get_w_type_donor/', {
    params: { search },
  });
  return response.data;
}

// export const api = {
//   // GET all items
//   getDonors: async () => {
//     const response = await fetch(`${API}/items/`);
//     if (!response.ok) throw new Error('Failed to fetch items');
//     return response.json();
//   },

//   // GET single item
//   getById: async (id: number) => {
//     const response = await fetch(`${API}/items/${id}`);
//     if (!response.ok) throw new Error('Failed to fetch item');
//     return response.json();
//   },

//   // POST create item
//   createItem: async (item: Record<string, unknown>) => {
//     const response = await fetch(`${API}/items/`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(item)
//     });
//     if (!response.ok) throw new Error('Failed to create item');
//     return response.json();
//   },

//   // PUT update item
//   updateItem: async (id: number, item: Record<string, unknown>) => {
//     const response = await fetch(`${API}/items/${id}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(item)
//     });
//     if (!response.ok) throw new Error('Failed to update item');
//     return response.json();
//   },

//   // DELETE item
//   deleteItem: async (id: number) => {
//     const response = await fetch(`${API}/items/${id}`, {
//       method: 'DELETE'
//     });
//     if (!response.ok) throw new Error('Failed to delete item');
//     return response.json();
//   }
// };


// GET all proposals (optionally with search or filter query)
export async function getFundingProposals(search = ''): Promise<any[]> {
  const response = await API.get(`/funding_proposals/proposals/all_proposals/`, {
    params: { search }, // if backend accepts it
  });
  return response.data;
}

export async function updateFundingProposal(id: number, data: any): Promise<any> {
  const response = await API.put(`/funding_proposals/proposals/update_proposal/${id}/`, data);
  return response.data;
}

export async function getFundingProposalsById(id: number): Promise<any> {
  const response = await API.get(`/funding_proposals/proposals/get_proposal/${id}/`);
  return response.data;
} 
