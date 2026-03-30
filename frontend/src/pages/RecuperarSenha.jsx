import React, { useState } from 'react';
import { recuperarSenha } from '../services/authService';
import './Login.css';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErro('Informe o e-mail cadastrado.');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const resposta = await recuperarSenha(email);
      setSucesso(true);
      if (resposta.previewUrl) setPreviewUrl(resposta.previewUrl);
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'Erro ao enviar e-mail. Tente novamente.');
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
            <h1>Recuperar senha</h1>
            <p>Informe seu e-mail para receber o link de redefinição</p>
          </div>

          {sucesso ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📧</div>
              <p style={{ fontWeight: 600 }}>E-mail enviado!</p>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                Verifique sua caixa de entrada e siga as instruções.
              </p>
              {previewUrl && (
                <p style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                  <strong>Ethereal (dev):</strong>{' '}
                  <a href={previewUrl} target="_blank" rel="noreferrer">
                    Visualizar e-mail
                  </a>
                </p>
              )}
              <a href="/login" className="btn-entrar" style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center', textDecoration: 'none' }}>
                Voltar ao login
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
                  <label htmlFor="email">E-mail</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉</span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErro(''); }}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-entrar" disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Enviar link de recuperação'}
                </button>
              </form>

              <div className="form-footer" style={{ marginTop: '1rem' }}>
                <a href="/login" className="link-cadastro">← Voltar ao login</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
