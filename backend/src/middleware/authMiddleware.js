const jwt = require('jsonwebtoken');
const Cliente = require('../models/Cliente');

const proteger = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ sucesso: false, mensagem: 'Não autorizado. Token ausente.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'infoglic_secret_dev');
    const cliente = await Cliente.findById(decoded.id);
    if (!cliente) {
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }
    req.usuario = cliente;
    next();
  } catch {
    return res.status(401).json({ sucesso: false, mensagem: 'Token inválido ou expirado.' });
  }
};

const apenasAdmin = (req, res, next) => {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso restrito a administradores.' });
  }
  next();
};

// RF04 – Garante que apenas usuários padrão possam registrar testes glicêmicos
const apenasUsuarioPadrao = (req, res, next) => {
  if (req.usuario?.role !== 'user') {
    return res.status(403).json({ sucesso: false, mensagem: 'Apenas usuários padrão podem registrar testes glicêmicos.' });
  }
  next();
};

module.exports = { proteger, apenasAdmin, apenasUsuarioPadrao };
