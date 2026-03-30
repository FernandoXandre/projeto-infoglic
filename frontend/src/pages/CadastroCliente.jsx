import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCadastroCliente } from '../hooks/useCadastroCliente';
import './CadastroCliente.css';

const CampoInput = ({ label, nome, tipo = 'text', placeholder, register, erros, rules, mask }) => {
  const temErro = !!erros[nome];
  return (
    <div className={`campo-grupo ${temErro ? 'campo-erro' : ''}`}>
      <label htmlFor={nome}>{label}</label>
      <input
        id={nome}
        type={tipo}
        placeholder={placeholder}
        autoComplete="off"
        {...register(nome, rules)}
      />
      {temErro && <span className="mensagem-erro">{erros[nome]?.message}</span>}
    </div>
  );
};

const validarCPF = (cpf) => {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return 'CPF inválido';
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(limpo[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo[9])) return 'CPF inválido';
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(limpo[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo[10])) return 'CPF inválido';
  return true;
};

export default function CadastroCliente() {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ mode: 'onBlur' });
  const { loading, sucesso, erro, errosCampos, clienteCadastrado, cadastrar, resetar } = useCadastroCliente();
  const [step, setStep] = useState(1);
  const senha = watch('senha');

  const onSubmit = async (dados) => {
    try {
      await cadastrar(dados);
      reset();
      setStep(1);
    } catch {}
  };

  if (sucesso && clienteCadastrado) {
    const nascFormatado = clienteCadastrado.dataNascimento
      ? new Date(clienteCadastrado.dataNascimento).toLocaleDateString('pt-BR')
      : '—';
    const criadoEm = clienteCadastrado.createdAt
      ? new Date(clienteCadastrado.createdAt).toLocaleString('pt-BR')
      : '—';

    return (
      <div className="cadastro-wrapper">
        <div className="cadastro-card">
          <div className="cadastro-header">
            <div className="logo">
              <div className="logo-badge">💉</div>
              <span className="logo-texto">Infoglic</span>
            </div>
          </div>
          <div className="card-body">
            <div className="sucesso-topo">
              <div className="sucesso-icone-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"
                  strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="sucesso-titulo">Cadastro realizado!</h2>
                <p className="sucesso-sub">Dados persistidos no MongoDB com sucesso</p>
              </div>
            </div>

            <div className="sucesso-db-card">
              <div className="sucesso-db-header">
                <span className="db-badge">MongoDB</span>
                <span className="db-colecao">coleção: clientes</span>
              </div>

              <div className="db-campo">
                <span className="db-key">_id</span>
                <span className="db-value db-id">{clienteCadastrado._id}</span>
              </div>
              <div className="db-campo">
                <span className="db-key">nome</span>
                <span className="db-value">{clienteCadastrado.nome}</span>
              </div>
              <div className="db-campo">
                <span className="db-key">email</span>
                <span className="db-value">{clienteCadastrado.email}</span>
              </div>
              <div className="db-campo">
                <span className="db-key">telefone</span>
                <span className="db-value">{clienteCadastrado.telefone}</span>
              </div>
              <div className="db-campo">
                <span className="db-key">cpf</span>
                <span className="db-value">{clienteCadastrado.cpf}</span>
              </div>
              <div className="db-campo">
                <span className="db-key">dataNascimento</span>
                <span className="db-value">{nascFormatado}</span>
              </div>
              <div className="db-campo">
                <span className="db-key">ativo</span>
                <span className="db-value db-bool">true</span>
              </div>
              <div className="db-campo">
                <span className="db-key">createdAt</span>
                <span className="db-value db-date">{criadoEm}</span>
              </div>
            </div>

            <button className="btn-primario" onClick={resetar} style={{ marginTop: '1rem' }}>
              + Novo cadastro
            </button>

            <div className="cadastro-footer">
              Já tem conta? <a href="/login">Entrar</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-wrapper">
      <div className="cadastro-card">
        <div className="cadastro-header">
          <div className="logo">
            <div className="logo-badge">💉</div>
            <span className="logo-texto">Infoglic</span>
          </div>
          <h1>Criar sua conta</h1>
          <p>Preencha seus dados para começar</p>
        </div>

        <div className="card-body">
        <div className="steps-indicador">
          <div className={`step ${step >= 1 ? 'ativo' : ''} ${step > 1 ? 'concluido' : ''}`}>
            <span>1</span><label>Pessoal</label>
          </div>
          <div className="step-linha" />
          <div className={`step ${step >= 2 ? 'ativo' : ''} ${step > 2 ? 'concluido' : ''}`}>
            <span>2</span><label>Contato</label>
          </div>
          <div className="step-linha" />
          <div className={`step ${step >= 3 ? 'ativo' : ''}`}>
            <span>3</span><label>Acesso</label>
          </div>
        </div>

        {erro && (
          <div className="alerta-erro">
            <span>⚠️</span> {erro}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* STEP 1 - Dados Pessoais */}
          {step === 1 && (
            <div className="step-conteudo">
              <CampoInput
                label="Nome completo"
                nome="nome"
                placeholder="Ex: Maria Silva"
                register={register}
                erros={{ ...errors, ...errosCampos }}
                rules={{
                  required: 'Nome é obrigatório',
                  minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                  maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                }}
              />
              <CampoInput
                label="CPF"
                nome="cpf"
                placeholder="000.000.000-00"
                register={register}
                erros={{ ...errors, ...errosCampos }}
                rules={{
                  required: 'CPF é obrigatório',
                  validate: validarCPF,
                }}
              />
              <CampoInput
                label="Data de nascimento"
                nome="dataNascimento"
                tipo="date"
                register={register}
                erros={errors}
                rules={{
                  required: 'Data de nascimento é obrigatória',
                  validate: (value) => {
                    const hoje = new Date();
                    const nasc = new Date(value);
                    let idade = hoje.getFullYear() - nasc.getFullYear();
                    const m = hoje.getMonth() - nasc.getMonth();
                    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
                    if (idade < 18) return 'É necessário ter pelo menos 18 anos';
                    return true;
                  },
                }}
              />
              <button type="button" className="btn-primario" onClick={async () => {
                const campos = ['nome', 'cpf', 'dataNascimento'];
                const validos = await Promise.all(campos.map(c => !errors[c]));
                if (campos.every((_, i) => validos[i])) setStep(2);
              }}>
                Continuar →
              </button>
            </div>
          )}

          {/* STEP 2 - Contato */}
          {step === 2 && (
            <div className="step-conteudo">
              <CampoInput
                label="E-mail"
                nome="email"
                tipo="email"
                placeholder="maria@email.com"
                register={register}
                erros={{ ...errors, ...errosCampos }}
                rules={{
                  required: 'E-mail é obrigatório',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' },
                }}
              />
              <CampoInput
                label="Telefone"
                nome="telefone"
                tipo="tel"
                placeholder="(61) 99999-9999"
                register={register}
                erros={errors}
                rules={{
                  required: 'Telefone é obrigatório',
                  pattern: { value: /^(\(?\d{2}\)?\s?)(\d{4,5}-?\d{4})$/, message: 'Formato inválido. Ex: (61) 99999-9999' },
                }}
              />
              <div className="botoes-navegacao">
                <button type="button" className="btn-secundario" onClick={() => setStep(1)}>← Voltar</button>
                <button type="button" className="btn-primario" onClick={() => setStep(3)}>Continuar →</button>
              </div>
            </div>
          )}

          {/* STEP 3 - Senha */}
          {step === 3 && (
            <div className="step-conteudo">
              <CampoInput
                label="Senha"
                nome="senha"
                tipo="password"
                placeholder="Mínimo 6 caracteres"
                register={register}
                erros={errors}
                rules={{
                  required: 'Senha é obrigatória',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                  pattern: { value: /(?=.*[A-Z])(?=.*\d)/, message: 'Deve conter 1 maiúscula e 1 número' },
                }}
              />
              <CampoInput
                label="Confirmar senha"
                nome="confirmarSenha"
                tipo="password"
                placeholder="Repita a senha"
                register={register}
                erros={errors}
                rules={{
                  required: 'Confirmação de senha é obrigatória',
                  validate: (value) => value === senha || 'As senhas não coincidem',
                }}
              />

              <div className="politica-texto">
                Ao se cadastrar, você concorda com os <a href="#">Termos de Uso</a> e <a href="#">Política de Privacidade</a> da Infoglic.
              </div>

              <div className="botoes-navegacao">
                <button type="button" className="btn-secundario" onClick={() => setStep(2)}>← Voltar</button>
                <button type="submit" className="btn-primario" disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Criar conta'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="cadastro-footer">
          Já tem conta? <a href="/login">Entrar</a>
        </div>
        </div> {/* card-body */}
      </div>
    </div>
  );
}