# 🍽️ Easy Table – RF01: Cadastro de Cliente

Sistema de reservas e comandas virtuais para estabelecimentos gastronômicos.

## Estrutura do Projeto

```
easy-table/
├── backend/              # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/       # Configuração do banco de dados
│   │   ├── controllers/  # Lógica dos endpoints (RF01)
│   │   ├── middleware/   # Validações com express-validator
│   │   ├── models/       # Schema Mongoose (Cliente)
│   │   ├── routes/       # Definição das rotas REST
│   │   └── server.js     # Entry point da API
│   ├── .env.example
│   └── package.json
│
└── frontend/             # React + react-hook-form
    ├── src/
    │   ├── hooks/        # useCadastroCliente (lógica isolada)
    │   ├── pages/        # CadastroCliente (RF01) + CSS
    │   ├── services/     # clienteService (Axios)
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Como executar

### Pré-requisitos
- Node.js 18+
- MongoDB rodando localmente (porta 27017) ou MongoDB Atlas

### Backend

```bash
cd backend
npm install

# Crie o arquivo de variáveis de ambiente
cp .env.example .env
# Edite o .env com sua URI do MongoDB

npm run dev   # Desenvolvimento (nodemon)
# ou
npm start     # Produção
```

A API estará disponível em `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm start
```

O frontend estará disponível em `http://localhost:3000`

## Endpoints da API

| Método | Rota                | Descrição              |
|--------|---------------------|------------------------|
| POST   | /api/clientes       | RF01 – Cadastro        |
| GET    | /api/clientes       | Listar todos           |
| GET    | /api/clientes/:id   | Buscar por ID          |
| GET    | /api/health         | Health check           |

### Exemplo de requisição – RF01

```json
POST /api/clientes
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "senha": "Senha123",
  "confirmarSenha": "Senha123",
  "telefone": "(61) 99999-9999",
  "cpf": "123.456.789-09",
  "dataNascimento": "1995-06-15"
}
```

### Resposta de sucesso (201)

```json
{
  "sucesso": true,
  "mensagem": "Cliente cadastrado com sucesso!",
  "dados": {
    "_id": "...",
    "nome": "Maria Silva",
    "email": "maria@email.com",
    "telefone": "(61) 99999-9999",
    "cpf": "123.456.789-09",
    "dataNascimento": "1995-06-15T00:00:00.000Z",
    "ativo": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## Regras de Negócio implementadas

- ✅ Todos os campos são obrigatórios
- ✅ E-mail único por cliente
- ✅ CPF único e validado matematicamente
- ✅ Idade mínima de 18 anos
- ✅ Senha com mínimo 6 caracteres, 1 maiúscula e 1 número
- ✅ Hash automático da senha (bcrypt)
- ✅ Senha nunca retornada nas respostas da API
- ✅ Validação no frontend (react-hook-form) e backend (express-validator)
