require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const clienteRoutes = require('./routes/clienteRoutes');
const authRoutes = require('./routes/authRoutes');
const registroRoutes = require('./routes/registroRoutes');
const medicamentoRoutes = require('./routes/medicamentoRoutes');
const eventoRoutes = require('./routes/eventoRoutes');
const refeicaoRoutes = require('./routes/refeicaoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar ao MongoDB
connectDB();

// Middlewares globais
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/clientes', clienteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/registros', registroRoutes);
app.use('/api/medicamentos', medicamentoRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/refeicoes', refeicaoRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', sistema: 'InfoGlic API', versao: '1.0.0' });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ sucesso: false, mensagem: 'Algo deu errado!' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ sucesso: false, mensagem: 'Rota não encontrada.' });
});

app.listen(PORT, () => {
  console.log(`💉  InfoGlic API rodando na porta ${PORT}`);
});