# Catálogo de Produtos – Autenticação e Middleware no Express

Tarefa avaliativa da disciplina **Tecnologias Back-end**. API em **Node.js + TypeScript + Express + Prisma (PostgreSQL)** com:

- registro e login de usuários, com hash de senha (**bcrypt**);
- autenticação via **JWT** (secret e expiração no `.env`);
- validação em runtime com **Zod**;
- **middleware** que protege as rotas de escrita de `products` (`POST`, `PUT`, `DELETE`). A leitura (`GET`) continua pública.

## Estrutura

```
my-app/
├── backend/                  # API (foco da tarefa)
│   ├── prisma/               # schema, migrations e seed
│   ├── src/server.ts         # rotas, schemas Zod e middleware de autenticação
│   ├── docker-compose.yml    # PostgreSQL
│   └── .env.example
├── frontend/                 # React + Vite (consome os GET públicos)
└── insomnia-collection.json  # requisições prontas para importar no Insomnia
```

## Pré-requisitos

- Node.js 20.6 ou superior
- Docker (para o PostgreSQL)

## Passo a passo

Todos os comandos abaixo são executados dentro de `backend/`.

1. Instalar as dependências:

   ```bash
   npm install
   ```

2. Criar o `.env` a partir do exemplo e trocar o valor de `JWT_SECRET`:

   ```bash
   cp .env.example .env
   ```

   Para gerar um segredo:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

3. Subir o banco de dados:

   ```bash
   docker compose up -d
   ```

4. Aplicar as migrations (cria as tabelas `products` e `users`):

   ```bash
   npx prisma migrate dev
   ```

5. Popular o banco (opcional). Recria os produtos de exemplo e garante o usuário `teste@exemplo.com` / `123456`:

   ```bash
   npm run seed
   ```

6. Iniciar a API em `http://localhost:3001`:

   ```bash
   npm run dev
   ```

7. Abrir o Prisma Studio para inspecionar as tabelas (repare que `users.password` guarda apenas o hash):

   ```bash
   npm run studio
   ```

### Variáveis de ambiente

| Variável         | Descrição                                   | Exemplo                                                                    |
| ---------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`   | Conexão com o PostgreSQL                    | `postgresql://admin:senha123@localhost:5433/catalogo_produtos?schema=public` |
| `JWT_SECRET`     | Segredo para assinar os tokens (obrigatório) | string longa e aleatória                                                   |
| `JWT_EXPIRES_IN` | Expiração do token                          | `7d`                                                                       |
| `PORT`           | Porta da API                                | `3001`                                                                     |

Sem `JWT_SECRET` a API não inicia.

## Model `User`

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // hash bcrypt, nunca texto puro
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

## Endpoints

| Método   | Rota                 | Autenticação | Descrição                          |
| -------- | -------------------- | ------------ | ---------------------------------- |
| `POST`   | `/api/auth/register` | –            | Cria usuário e retorna token       |
| `POST`   | `/api/auth/login`    | –            | Autentica e retorna token          |
| `GET`    | `/api/auth/me`       | Bearer       | Dados do usuário autenticado       |
| `GET`    | `/api/products`      | –            | Lista produtos                     |
| `GET`    | `/api/products/:id`  | –            | Busca produto por id               |
| `POST`   | `/api/products`      | Bearer       | Cria produto                       |
| `PUT`    | `/api/products/:id`  | Bearer       | Atualiza produto (campos parciais) |
| `DELETE` | `/api/products/:id`  | Bearer       | Remove produto                     |

Rotas protegidas exigem o header:

```
Authorization: Bearer <token>
```

Os erros seguem sempre o formato `{ "error": "mensagem" }`.

## Exemplos de payloads

### `POST /api/auth/register`

Regras (Zod): `email` válido, `password` com no mínimo 6 caracteres, `name` opcional.

```json
{
  "email": "maria@exemplo.com",
  "password": "123456",
  "name": "Maria"
}
```

Resposta `201`:

```json
{
  "message": "Usuário criado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "maria@exemplo.com", "name": "Maria" }
}
```

Erros `400`:

```json
{ "error": "Email inválido" }
```

```json
{ "error": "Senha deve ter pelo menos 6 caracteres" }
```

```json
{ "error": "Email já está em uso" }
```

### `POST /api/auth/login`

```json
{
  "email": "maria@exemplo.com",
  "password": "123456"
}
```

Resposta `200`:

```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "maria@exemplo.com", "name": "Maria" }
}
```

Erro `401` (e-mail inexistente ou senha incorreta):

```json
{ "error": "Email ou senha incorretos" }
```

### `GET /api/auth/me`

Com token, resposta `200`:

```json
{
  "message": "Usuário autenticado",
  "user": { "id": 1, "email": "maria@exemplo.com", "name": "Maria" }
}
```

Sem token ou com token inválido, resposta `401`:

```json
{ "error": "Token de acesso não fornecido" }
```

```json
{ "error": "Token inválido" }
```

### `POST /api/products` (protegida)

```json
{
  "title": "Headset Gamer",
  "description": "Headset com som surround e microfone removível.",
  "price": 299.9,
  "imageUrl": "/images/headset.png",
  "isFeatured": true
}
```

Resposta `201`:

```json
{
  "message": "Produto criado com sucesso",
  "product": {
    "id": 6,
    "title": "Headset Gamer",
    "description": "Headset com som surround e microfone removível.",
    "price": 299.9,
    "imageUrl": "/images/headset.png",
    "isFeatured": true,
    "createdAt": "2026-10-09T17:13:30.659Z",
    "updatedAt": "2026-10-09T17:13:30.659Z"
  }
}
```

Sem token: `401`. Com dados inválidos: `400`, por exemplo `{ "error": "Título deve ter pelo menos 3 caracteres" }`.

### `PUT /api/products/:id` (protegida)

Aceita qualquer subconjunto dos campos do produto:

```json
{
  "price": 249.9,
  "isFeatured": false
}
```

Resposta `200` com `{ "message": "Produto atualizado com sucesso", "product": { ... } }`. Id inexistente: `404`.

### `DELETE /api/products/:id` (protegida)

Sem body. Resposta `200`:

```json
{ "message": "Produto deletado com sucesso" }
```

Id inexistente: `404`.

## Testes no Insomnia

Importe o arquivo [`insomnia-collection.json`](insomnia-collection.json) (Insomnia → *Import* → *From File*). A collection traz o ambiente com duas variáveis:

- `base_url`: `http://localhost:3001`
- `token`: cole aqui o token retornado pelo login

Roteiro coberto pela collection:

| #   | Requisição                           | Esperado |
| --- | ------------------------------------ | -------- |
| 1   | Register – válido                    | `201`    |
| 2   | Register – e-mail inválido           | `400`    |
| 3   | Register – senha curta               | `400`    |
| 4   | Register – e-mail já em uso          | `400`    |
| 5   | Login – válido (copiar o token)      | `200`    |
| 6   | Login – senha incorreta              | `401`    |
| 7   | Me – sem token                       | `401`    |
| 8   | Me – com token                       | `200`    |
| 9   | Listar / buscar produtos (público)   | `200`    |
| 10  | Criar / atualizar / remover sem token | `401`    |
| 11  | Criar / atualizar / remover com token | `201` / `200` / `200` |

## Frontend (opcional)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abre em `http://localhost:5173` (origem liberada no CORS da API).
