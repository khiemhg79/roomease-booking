import http from './http'
const unwrap = (response) => response.data.data

export const authApi = {
  customerLogin: (payload) => http.post('/auth/customer/login', payload).then(unwrap),
  customerRegister: (payload) => http.post('/auth/customer/register', payload).then(unwrap),
  customerGoogle: (credential) => http.post('/auth/customer/google', { credential }).then(unwrap),
  managerLogin: (payload) => http.post('/auth/manager/login', payload).then(unwrap),
  adminLogin: (payload) => http.post('/auth/admin/login', payload).then(unwrap),
  me: () => http.get('/auth/me').then(unwrap),
}
