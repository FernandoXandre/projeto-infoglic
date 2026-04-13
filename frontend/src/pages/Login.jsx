import React, { useState } from 'react';
import './Login.css';
import logoInfoglic from '../assets/imagemInfoGlic.jpeg';
import { login as loginService } from '../services/authService';

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.senha) {
      setErro('Preencha e-mail e senha para continuar.');
      return;
    }
    setLoading(true);
    try {
      const resposta = await loginService(form);
      localStorage.setItem('token', resposta.token);
      localStorage.setItem('usuario', JSON.stringify(resposta.dados));
      // Redireciona para o dashboard (a ser implementado)
      window.location.href = '/dashboard';
    } catch (error) {
      const mensagem = error.response?.data?.mensagem || 'E-mail ou senha incorretos.';
      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Orbs de fundo */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-card">
        {/* Seção esquerda — logo */}
        <div className="login-lado-logo">
          <div className="logo-circulo">
            <img src={logoInfoglic} alt="Infoglic" className="logo-img" />
          </div>
          <h2 className="logo-nome">InfoGlic</h2>
          <p className="logo-slogan">Sua agenda glicêmica!</p>

          <div className="divisor-v" />

          <ul className="features-list">
            <li><span className="feat-icon">📊</span> Histórico de medições</li>
            <li><span className="feat-icon">🔔</span> Alertas personalizados</li>
            <li><span className="feat-icon">🩺</span> Relatórios médicos</li>
            <li><span className="feat-icon">🔒</span> Dados criptografados</li>
          </ul>
        </div>

        {/* Seção direita — formulário */}
        <div className="login-lado-form">
          <div className="form-header">
            <h1>Bem-vindo de volta</h1>
            <p>Acesse sua conta para continuar</p>
          </div>

          {erro && (
            <div className="alerta-erro">
              <span className="alerta-icon">⚠</span>
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="login-form">
            <div className="campo-grupo">
              <label htmlFor="email">E-mail</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="campo-grupo">
              <div className="label-row">
                <label htmlFor="senha">Senha</label>
                <a href="/recuperar-senha" className="link-esqueci">Esqueci minha senha</a>
              </div>
              <div className="input-wrapper">
                <input
                  id="senha"
                  name="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn-olho"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  tabIndex={-1}
                >
                  {mostrarSenha ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-entrar" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Entrar na conta'}
            </button>
          </form>

          <div className="divisor-h">
            <span>ou</span>
          </div>

          <div className="form-footer">
            Não tem conta?{' '}
            <a href="/cadastro" className="link-cadastro">Criar conta gratuita</a>
          </div>
        </div>
      </div>
    </div>
  );
}
