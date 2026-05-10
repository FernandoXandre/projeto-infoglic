import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// RF07 – Medicamentos
export const listarMedicamentos = () =>
  api.get('/medicamentos', getHeaders()).then(r => r.data);

export const criarMedicamento = (dados) =>
  api.post('/medicamentos', dados, getHeaders()).then(r => r.data);

export const atualizarMedicamento = (id, dados) =>
  api.put(`/medicamentos/${id}`, dados, getHeaders()).then(r => r.data);

export const desativarMedicamento = (id) =>
  api.delete(`/medicamentos/${id}`, getHeaders()).then(r => r.data);

// RF07 – Checklist diário de doses
export const listarRegistrosDia = () =>
  api.get('/medicamentos/registros/hoje', getHeaders()).then(r => r.data);

export const registrarDose = (dados) =>
  api.post('/medicamentos/registros/hoje', dados, getHeaders()).then(r => r.data);

// RF07 – Histórico de locais (rodízio de insulina)
export const historicoLocais = (medId) =>
  api.get(`/medicamentos/${medId}/locais`, getHeaders()).then(r => r.data);

export const historicoDoses = (dias = 7) =>
  api.get(`/medicamentos/registros/historico?dias=${dias}`, getHeaders()).then(r => r.data);
