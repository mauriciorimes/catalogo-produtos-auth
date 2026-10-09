import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors'
import { PrismaClient, Prisma } from '@prisma/client';
import {z} from 'zod';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();

app.use(cors({origin: 'http://localhost:5173'}))
app.use(express.json());

const registerSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().optional()
})

const loginSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
})

// Segredo e expiração do JWT vêm do .env (veja .env.example)
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não definido. Copie .env.example para .env e preencha o valor.')
}

const JWT_SECRET: string = process.env.JWT_SECRET
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '7d') as NonNullable<SignOptions['expiresIn']>

const generateToken = (userId: number) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

// Schema de criação de produto
const createProductSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  // coerce: tenta converter "2000" (string) em numero antes de validar positive()
  price: z.coerce.number().positive('Preço deve ser maior que zero'),
  imageUrl: z.string().min(1, 'imageUrl não pode ser vazio'),
  // aceita true/false e também "true"/"false" (coerce.boolean trataria "false" como true)
  isFeatured: z.union([z.boolean(), z.stringbool()]).optional(),
})

const updateProductSchema = createProductSchema.partial();

// Erro do Prisma quando o registro a alterar/remover não existe
const isNotFoundError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'

// Interface para estender o Request do Express
interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    name?: string | null
  }
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Extrair token do header Authorization
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: 'Token de acesso não fornecido' })
    }

    // Header deve ser: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const [scheme, token] = authHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Formato do token inválido' })
    }

    // 2. Verificar se token é válido
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

    // 3. Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true } // Não buscar a senha
    })

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }

    // 4. Anexar usuário à requisição
    req.user = user

    // 5. Continuar para a próxima função (rota final)
    next()

  } catch (error) {
    // TokenExpiredError herda de JsonWebTokenError, então precisa vir primeiro
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token inválido' })
    }
    console.error('Erro no middleware de autenticação:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  // Se chegou até aqui, o middleware já validou o token
  return res.status(200).json({
    message: 'Usuário autenticado',
    user: req.user
  })
})

app.get('/', (req: Request, res: Response) => {
    res.json({message: "Olá mundo! Bem-vindo à API do nosso Catálogo de Produtos!"})
})

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    // 1. Validar dados de entrada
    const { email, password, name } = registerSchema.parse(req.body)

    // 2. Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso' })
    }

    // 3. Criar hash da senha (10 rounds é um bom padrão de segurança)
    const hashedPassword = await bcrypt.hash(password, 10)

    // 4. Criar usuário no banco
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    // 5. Gerar token JWT
    const token = generateToken(user.id)

    // 6. Retornar sucesso (sem a senha!)
    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? 'Dados inválidos' })
    }
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    // 1. Validar dados de entrada
    const { email, password } = loginSchema.parse(req.body)

    // 2. Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' })
    }

    // 3. Comparar senha fornecida com hash salvo
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou senha incorretos' })
    }

    // 4. Gerar token JWT
    const token = generateToken(user.id)

    // 5. Retornar sucesso
    return res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? 'Dados inválidos' })
    }
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

app.get('/api/products', async (_req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany()
        return res.status(200).json(products)        
    } catch (error) {
        console.error('Erro ao listar produtos:', error)
        return res.status(500).json({error: 'Erro ao listar produtos'})
    }
})

app.get('/api/products/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
   
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({error: 'ID inválido. Use um inteiro positivo.'})
    }

    try {
        const product = await prisma.product.findUnique({ where: { id }})

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado'})
        }

        return res.status(200).json(product)
    } catch (error) {
        console.error('Erro ao buscar produto:', error)
        return res.status(500).json({ error: 'Erro ao buscar produto'})
    }
})

// 7) POST /api/products - cria com validação

app.post('/api/products', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, price, description, imageUrl, isFeatured } = createProductSchema.parse(req.body)

    const product = await prisma.product.create({
      data: { title, price, description, imageUrl, isFeatured: isFeatured ?? false }
    })

    return res.status(201).json({
      message: 'Produto criado com sucesso',
      product
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? 'Dados inválidos' })
    }
    return res.status(500).json({ error: 'Erro ao criar produto' })
  }
})

// PUT /api/products/:id - atualiza (parcial) com validação
app.put('/api/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  try {
    const { title, price, description, imageUrl, isFeatured } = updateProductSchema.parse(req.body)

    // Só envia ao Prisma os campos que vieram no body
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(price !== undefined && { price }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isFeatured !== undefined && { isFeatured }),
      }
    })

    return res.status(200).json({
      message: 'Produto atualizado com sucesso',
      product
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? 'Dados inválidos' })
    }
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }
    console.error('Erro ao atualizar produto:', error)
    return res.status(500).json({ error: 'Erro ao atualizar produto' })
  }
})

// DELETE /api/products/:id - remove item
app.delete('/api/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  try {
    await prisma.product.delete({ where: { id } })

    return res.status(200).json({
      message: 'Produto deletado com sucesso'
    })
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }
    console.error('Erro ao deletar produto:', error)
    return res.status(500).json({ error: 'Erro ao deletar produto' })
  }
})

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso em http://localhost:${PORT}`);
    
})
