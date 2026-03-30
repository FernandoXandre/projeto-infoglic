import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { redefinirSenha as redefinirSenhaService } from '../services/authService';
import './Login.css';

export default function RedefinirSenha() {
  const { token } = useParams();
  const [form, setForm] = useState({ senha: '', confirmarSenha: '' });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.senha || !form.confirmarSenha) {
      setErro('Preencha os dois campos de senha.');
      return;
    }
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      await redefinirSenhaService({ token, ...form });
      setSucesso(true);
    } catch (error) {
      const resposta = error.response?.data;
      if (resposta?.erros?.length) {
        setErro(resposta.erros[0].mensagem);
      } else {
        setErro(resposta?.mensagem || 'Token inválido ou expirado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-card" style={{ maxWidth: 480, margin: 'auto' }}>
        <div className="login-lado-form" style={{ width: '100%' }}>
          <div className="form-header">
            <h1>Nova senha</h1>
            <p>Crie uma nova senha para sua conta</p>
          </div>

          {sucesso ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
              <p style={{ fontWeight: 600 }}>Senha redefinida com sucesso!</p>
              <a href="/login" className="btn-entrar" style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center', textDecoration: 'none' }}>
                Fazer login
              </a>
            </div>
          ) : (
            <>
              {erro && (
                <div className="alerta-erro">
                  <span className="alerta-icon">⚠</span>
                  <span>{erro}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="login-form">
                <div className="campo-grupo">
                  <label htmlFor="senha">Nova senha</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔑</span>
                    <input
                      id="senha"
                      name="senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={form.senha}
                      onChange={handleChange}
                      autoComplete="new-password"
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

                <div className="campo-grupo">
                  <label htmlFor="confirmarSenha">Confirmar nova senha</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔑</span>
                    <input
                      id="confirmarSenha"
                      name="confirmarSenha"
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      value={form.confirmarSenha}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-entrar" disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
