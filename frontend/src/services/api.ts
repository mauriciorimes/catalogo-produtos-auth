// src/services/api.ts
import type { ApiIssue, Product as ProductData, ProductFormData } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Erro da API com os detalhes de validação do Zod (quando o backend responde 400)
export class ApiError extends Error {
  status: number
  issues: ApiIssue[]

  constructor(message: string, status: number, issues: ApiIssue[] = []) {
    super(message)
    this.status = status
    this.issues = issues
  }
}

async function handle<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const body = await resp.json().catch(() => null)
    throw new ApiError(
      body?.error || `HTTP ${resp.status} - ${resp.statusText}`,
      resp.status,
      body?.issues ?? [],
    )
  }
  return resp.json() as Promise<T>
}

export async function fetchProducts(): Promise<ProductData[]> {
  const resp = await fetch(`${BASE_URL}/api/products`)
  return handle<ProductData[]>(resp)
}

export async function fetchProductById(id: number): Promise<ProductData> {
  const resp = await fetch(`${BASE_URL}/api/products/${id}`)
  return handle<ProductData>(resp)
}

export async function createProduct(data: ProductFormData): Promise<ProductData> {
  const resp = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handle<ProductData>(resp)
}
