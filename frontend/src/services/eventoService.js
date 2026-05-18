import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// RF12 – Eventos externos do mês (YYYY-MM) ou últimos N dias
export const listarEventos = (mes) =>
  api.get('/eventos', { ...getHeaders(), params: mes ? { mes } : { dias: 30 } }).then(r => r.data);

// RF12 – Meses que possuem ao menos um evento
export const listarMesesEventos = () =>
  api.get('/eventos/meses', getHeaders()).then(r => r.data);

export const salvarEvento = (dados) =>
  api.post('/eventos', dados, getHeaders()).then(r => r.data);

export const removerEvento = (id) =>
  api.delete(`/eventos/${id}`, getHeaders()).then(r => r.data);
