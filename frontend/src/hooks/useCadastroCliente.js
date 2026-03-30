import { useState } from 'react';
import { cadastrarCliente } from '../services/clienteService';

export const useCadastroCliente = () => {
  const [status, setStatus] = useState({
    loading: false,
    sucesso: false,
    erro: null,
    errosCampos: {},
    clienteCadastrado: null,
  });

  const cadastrar = async (dados) => {
    setStatus({ loading: true, sucesso: false, erro: null, errosCampos: {}, clienteCadastrado: null });
    try {
      const resposta = await cadastrarCliente(dados);
      setStatus({
        loading: false,
        sucesso: true,
        erro: null,
        errosCampos: {},
        clienteCadastrado: resposta.dados,
      });
      return resposta;
    } catch (error) {
      const resposta = error.response?.data;
      const errosCampos = {};
      if (resposta?.erros) {
        resposta.erros.forEach(({ campo, mensagem }) => { errosCampos[campo] = mensagem; });
      }
      setStatus({
        loading: false,
        sucesso: false,
        erro: resposta?.mensagem || 'Erro ao realizar cadastro.',
        errosCampos,
        clienteCadastrado: null,
      });
      throw error;
    }
  };

  const resetar = () => setStatus({
    loading: false, sucesso: false, erro: null, errosCampos: {}, clienteCadastrado: null,
  });

  return { ...status, cadastrar, resetar };
};