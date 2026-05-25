# 💉 InfoGlic — Sistema de Monitoramento Glicêmico

> Projeto acadêmico — SENAC · 4º Semestre · Inovação  
> **Grupo:** Fernando Alexandre · Jefferson Niccácio · Jerônimo Alves · Lucas Freitas · Marcelo Alexandre · Roberta Campos

Sistema web para monitoramento contínuo da glicemia, ajudando pacientes diabéticos a registrar medições, refeições, medicamentos e fatores externos que influenciam o controle glicêmico.

---

## 🚦 Status dos Requisitos Funcionais

| RF | Funcionalidade | Status |
|----|---------------|--------|
| RF01 | Cadastro de Usuário + ativação por e-mail | ✅ Implementado |
| RF02 | Login com JWT | ✅ Implementado |
| RF03 | Recuperação e redefinição de senha | ✅ Implementado |
| RF04 | Registro de Teste Glicêmico (CRUD) | ✅ Implementado |
| RF05 | Lembretes de testes e refeições | ⚠️ Parcial |
| RF06 | Alertas de Hipoglicemia e Hiperglicemia | ✅ Implementado |
| RF07 | Registro e Lembrete de Medicação | ✅ Implementado |
| RF08 | Diário Alimentar com foto | ✅ Implementado |
| RF09 | Insights automáticos de alimentação | ❌ Pendente |
| RF10 | Relatório consolidado | ⚠️ Parcial |
| RF11 | Notificação de Emergência (SOS) | ❌ Pendente |
| RF12 | Registro de Eventos Externos | ✅ Implementado |

> ✅ Completo · ⚠️ Parcial · ❌ Pendente

---

## ✅ O que está funcionando

### RF01 · Cadastro de Usuário
- Formulário com nome, e-mail, senha, telefone, CPF, data de nascimento e tipo de diabetes
- Senha com hash bcrypt (mín. 6 caracteres, 1 maiúscula, 1 número)
- Validação dupla: frontend (react-hook-form) + backend (express-validator)
- **Ativação por e-mail** obrigatória antes do primeiro login
- Em desenvolvimento: Ethereal Email (link de preview no console); em produção: Gmail SMTP

### RF02 · Login
- Autenticação via e-mail + senha
- Token JWT com validade de 7 dias
- Bloqueia login se a conta não foi ativada por e-mail
- Registra `ultimoAcesso` a cada login (usado nos lembretes de ausência)

### RF03 · Recuperação de Senha
- Fluxo "Esqueci minha senha" → e-mail com link de redefinição
- Token de reset com expiração de **1 hora**
- Resposta genérica (não revela se o e-mail existe)

### RF04 · Registro de Teste Glicêmico
- Criação, edição e exclusão de medições
- Campos: valor (20–600 mg/dL), data/hora, estado e observação
- **Estados disponíveis:** Jejum · Pré-prandial · Pós-prandial · Madrugada · Geral
- Bloqueio de datas futuras
- Navegação por mês com gráfico SVG interativo (paginado, 14 pontos por página)

### RF05 · Lembretes *(parcial)*
- **Frontend:** usuário configura horários de café, almoço e jantar; alertas visuais aparecem 30 min após o horário sem registro
- **Backend:** cron jobs enviam e-mail se nenhuma refeição for registrada na janela (11h, 18h, 22h BRT) ou se não houver medição glicêmica no dia (20h BRT)
- ⚠️ Faltando: notificação *push* persistente no navegador

### RF06 · Alertas Glicêmicos
- Verifica automaticamente a última medição registrada
- **Hipoglicemia** (< 70 mg/dL): alerta vermelho com instruções de ação rápida
- **Hiperglicemia** (> 180 mg/dL): alerta âmbar com orientações de hidratação e medicação
- Alertas podem ser fechados individualmente

### RF07 · Medicamentos e Doses
- Cadastro de medicamentos com nome, dosagem, tipo (Insulina / Oral / Outro) e horários programados
- **Checklist diário**: marcar cada dose como Tomado · Pulado · Adiado
- Para insulina: seleção do **local de aplicação** a cada dose (rodízio: Abdômen, Coxa, Braço, Glúteo — D/E)
- Histórico de doses com gráfico de adesão semanal

### RF08 · Diário Alimentar
- Registro de refeições com data/hora, estimativa de carboidratos (baixa / média / alta) e foto
- Foto comprimida no navegador antes do envio (máx. 600 px, JPEG 75%)
- **Vinculação** entre refeição e teste pós-prandial para análise de correlação
- Gráfico de refeições por dia (barras empilhadas por nível de carboidrato)

### RF10 · Relatório *(parcial)*
- Períodos disponíveis: 7, 15, 30 ou 90 dias
- Exibe: média glicêmica, desvio padrão, **TIR** (Time in Range), total de hipos e hipers
- Correlações alimentares: refeições vinculadas a testes pós-prandiais
- Aderência a medicamentos: % de doses tomadas vs. puladas
- ⚠️ Faltando: exportação em PDF

### RF12 · Contexto do Dia
- Tags diárias: **Estresse · Atividade Física · Doença/Febre · Álcool**
- Um registro por dia por usuário (editável)
- Tags aparecem sobrepostas no gráfico glicêmico como pontos coloridos

---

## ⚠️ Pendências

| Item | Descrição |
|------|-----------|
| RF05 – Push notification | Notificação persistente no navegador quando teste não é registrado |
| RF09 – Insights | Detectar padrão de 3 hiperglicemias seguidas após a mesma refeição |
| RF10 – PDF | Exportar relatório em PDF formatado |
| RF11 – SOS | Envio de SMS para contatos de emergência em hipoglicemia < 55 mg/dL |

---

## 🚀 Como executar

### Pré-requisitos
- Node.js 18+
- MongoDB local (porta 27017) ou MongoDB Atlas

### Backend

```bash
cd backend
cp .env.example .env    # preencha MONGODB_URI, JWT_SECRET e EMAIL_*
npm install
npm run dev             # nodemon — porta 5000
```

### Frontend

```bash
cd frontend
npm install
npm start               # porta 3001
```

> O frontend faz proxy automático de `/api/*` para `http://localhost:5000`.

---

## 📡 Endpoints da API

### Autenticação
| Método | Rota | RF | Descrição |
|--------|------|----|-----------|
| `POST` | `/api/clientes` | RF01 | Cadastro |
| `GET` | `/api/auth/ativar/:token` | RF01 | Ativar conta |
| `POST` | `/api/auth/login` | RF02 | Login |
| `POST` | `/api/auth/recuperar-senha` | RF03 | Solicitar reset |
| `POST` | `/api/auth/redefinir-senha/:token` | RF03 | Redefinir senha |

### Recursos protegidos *(requerem `Authorization: Bearer <token>`)*
| Método | Rota | RF | Descrição |
|--------|------|----|-----------|
| `GET/POST` | `/api/registros` | RF04 | Listar / criar medições |
| `PUT/DELETE` | `/api/registros/:id` | RF04 | Editar / remover medição |
| `GET` | `/api/registros/meses` | RF04 | Meses com registros |
| `GET/POST/PUT/DELETE` | `/api/medicamentos` | RF07 | CRUD de medicamentos |
| `GET/POST` | `/api/medicamentos/registros/hoje` | RF07 | Checklist diário |
| `GET` | `/api/medicamentos/registros/historico` | RF07 | Histórico de doses |
| `GET/POST/DELETE` | `/api/eventos` | RF12 | Contexto do dia |
| `GET/POST/PUT/DELETE` | `/api/refeicoes` | RF08 | Diário alimentar |
| `GET` | `/api/health` | — | Health check |

---

## 🗂️ Estrutura do Projeto

```
projeto-infoglic/
├── backend/
│   └── src/
│       ├── config/          # Banco de dados (MongoDB) e e-mail (Nodemailer)
│       ├── controllers/     # Lógica de negócio por recurso
│       ├── middleware/      # JWT (authMiddleware) + validações (express-validator)
│       ├── models/          # Schemas Mongoose
│       ├── routes/          # Definição das rotas REST
│       ├── services/        # lembreteService (cron jobs)
│       └── server.js        # Entry point
└── frontend/
    └── src/
        ├── hooks/           # useCadastroCliente
        ├── pages/           # Uma página por fluxo + Dashboard principal
        └── services/        # Clientes Axios por recurso
```
