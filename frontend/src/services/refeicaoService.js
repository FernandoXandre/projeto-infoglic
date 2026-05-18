import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RF08 – Listar refeições do mês (YYYY-MM) ou últimos N dias
export const listarRefeicoes = (mes) =>
  api.get('/refeicoes', { params: mes ? { mes } : { dias: 30 } }).then(r => r.data);

// RF08 – Meses que possuem ao menos uma refeição
export const listarMesesRefeicoes = () =>
  api.get('/refeicoes/meses').then(r => r.data);

// RF08 – Criar nova refeição
export const criarRefeicao = (dados) =>
  api.post('/refeicoes', dados).then(r => r.data);

// RF08 – Atualizar refeição existente
export const atualizarRefeicao = (id, dados) =>
  api.put(`/refeicoes/${id}`, dados).then(r => r.data);

// RF08 – Remover refeição
export const removerRefeicao = (id) =>
  api.delete(`/refeicoes/${id}`).then(r => r.data);

// RF08 – Vincular/desvincular refeição a um teste glicêmico
export const vincularRefeicao = (id, registroId) =>
  api.patch(`/refeicoes/${id}/vincular`, { registroId }).then(r => r.data);
