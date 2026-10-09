export interface Product {
  id: number
  title: string
  description: string
  price: number
  imageUrl: string
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

// Dados que o formulário envia para o POST /api/products
export type ProductFormData = Pick<Product, 'title' | 'description' | 'price' | 'imageUrl' | 'isFeatured'>

export interface ApiIssue {
  path: string
  message: string
}
