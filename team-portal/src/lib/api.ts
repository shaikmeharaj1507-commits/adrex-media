const API_URL = 'http://localhost:5000/api';

export const getHeaders = () => {
  const token = localStorage.getItem('adrex_token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
};

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      }).then(r => r.json()),
    logout: () =>
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }),
  },
  user: {
    getProfile: () =>
      fetch(`${API_URL}/user/profile`, { headers: getHeaders() }).then(r => r.json()),
    updateProfile: (data: any) =>
      fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(r => r.json()),
  },
  tasks: {
    getMyTasks: () =>
      fetch(`${API_URL}/tasks`, { headers: getHeaders() }).then(r => r.json()),
    updateStatus: (id: string, status: string) =>
      fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
  },
  messages: {
    getConversations: () =>
      fetch(`${API_URL}/messages/conversations`, { headers: getHeaders() }).then(r => r.json()),
    getMessages: (userId: string) =>
      fetch(`${API_URL}/messages/${userId}`, { headers: getHeaders() }).then(r => r.json()),
    send: (receiverId: string, content: string) =>
      fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ receiverId, content }),
      }).then(r => r.json()),
    markRead: (id: string) =>
      fetch(`${API_URL}/messages/${id}/read`, {
        method: 'PUT',
        headers: getHeaders(),
      }).then(r => r.json()),
  },
  team: {
    getMembers: () =>
      fetch(`${API_URL}/team`, { headers: getHeaders() }).then(r => r.json()),
  },
  agency: {
    get: () =>
      fetch(`${API_URL}/agency`, { headers: getHeaders() }).then(r => r.json()),
  },
  calendar: {
    get: () =>
      fetch(`${API_URL}/calendar`, { headers: getHeaders() }).then(r => r.json()),
  },
};
