import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const cadastrarCliente = async (dados) => {
  const response = await api.post('/clientes', dados);
  return response.data;
};

export const listarClientes = async () => {
  const response = await api.get('/clientes', getHeaders());
  return response.data;
};

// RF09 – Retorna perfil do usuário autenticado (inclui fatorSensibilidade e glicemiaAlvo)
export const obterPerfil = () =>
  api.get('/clientes/perfil', getHeaders()).then(r => r.data);

// RF09 – Atualiza fatorSensibilidade e glicemiaAlvo
export const atualizarPerfil = (dados) =>
  api.patch('/clientes/perfil', dados, getHeaders()).then(r => r.data);

export default api;