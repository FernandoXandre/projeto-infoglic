import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// RF02 – Login
export const login = async ({ email, senha }) => {
  const response = await api.post('/auth/login', { email, senha });
  return response.data;
};

// RF03 – Solicitar recuperação de senha
export const recuperarSenha = async (email) => {
  const response = await api.post('/auth/recuperar-senha', { email });
  return response.data;
};

// RF03 – Redefinir senha com token
export const redefinirSenha = async ({ token, senha, confirmarSenha }) => {
  const response = await api.post(`/auth/redefinir-senha/${token}`, { senha, confirmarSenha });
  return response.data;
};

export default api;
