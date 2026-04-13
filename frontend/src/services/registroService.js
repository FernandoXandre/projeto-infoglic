import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// RF04 – Listar registros do usuário autenticado
export const listar = () =>
  api.get('/registros', getHeaders()).then(r => r.data);

// RF04 – Criar novo registro glicêmico
export const criar = (dados) =>
  api.post('/registros', dados, getHeaders()).then(r => r.data);

// RF04 – Editar registro existente
export const atualizar = (id, dados) =>
  api.put(`/registros/${id}`, dados, getHeaders()).then(r => r.data);

// RF04 – Remover registro
export const remover = (id) =>
  api.delete(`/registros/${id}`, getHeaders()).then(r => r.data);
