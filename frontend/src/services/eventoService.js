import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// RF12 – Eventos externos
export const listarEventos = (dias = 30) =>
  api.get(`/eventos?dias=${dias}`, getHeaders()).then(r => r.data);

export const salvarEvento = (dados) =>
  api.post('/eventos', dados, getHeaders()).then(r => r.data);

export const removerEvento = (id) =>
  api.delete(`/eventos/${id}`, getHeaders()).then(r => r.data);
