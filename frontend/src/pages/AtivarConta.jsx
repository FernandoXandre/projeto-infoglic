import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './AtivarConta.css';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

export default function AtivarConta() {
  const { token } = useParams();
  const [estado, setEstado] = useState('carregando'); // 'carregando' | 'sucesso' | 'erro'
  const [mensagem, setMensagem] = useState('');
  // Garante que a chamada à API ocorra apenas uma vez,
  // mesmo com o React 18 Strict Mode que monta o componente duas vezes em dev.
  const chamado = useRef(false);

  useEffect(() => {
    if (chamado.current) return;
    chamado.current = true;

    api.get(`/auth/ativar/${token}`)
      .then(res => {
        setEstado('sucesso');
        setMensagem(res.data.mensagem || 'Conta ativada com sucesso!');
      })
      .catch(err => {
        setEstado('erro');
        setMensagem(
          err.response?.data?.mensagem || 'Token inválido ou expirado. Tente se cadastrar novamente.'
        );
      });
  }, [token]);

  return (
    <div className="ativar-wrapper">
      <div className="orb orb-a1" />
      <div className="orb orb-a2" />

      <div className="ativar-card">
        <div className="ativar-logo">
          <span className="ativar-logo-icon">💉</span>
          <span className="ativar-logo-nome">InfoGlic</span>
        </div>

        {estado === 'carregando' && (
          <>
            <div className="ativar-spinner" />
            <p className="ativar-texto">Ativando sua conta...</p>
          </>
        )}

        {estado === 'sucesso' && (
          <>
            <div className="ativar-icone ativar-icone-ok">✓</div>
            <h1 className="ativar-titulo">Conta ativada!</h1>
            <p className="ativar-texto">{mensagem}</p>
            <a href="/login" className="ativar-btn">Fazer login</a>
          </>
        )}

        {estado === 'erro' && (
          <>
            <div className="ativar-icone ativar-icone-erro">✕</div>
            <h1 className="ativar-titulo">Falha na ativação</h1>
            <p className="ativar-texto">{mensagem}</p>
            <a href="/cadastro" className="ativar-btn ativar-btn-erro">Criar nova conta</a>
          </>
        )}
      </div>
    </div>
  );
}
