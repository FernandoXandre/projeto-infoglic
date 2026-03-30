import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

export const cadastrarCliente = async (dados) => {
  const response = await api.post('/clientes', dados);
  return response.data;
};

export const listarClientes = async () => {
  const response = await api.get('/clientes');
  return response.data;
};

export default api;