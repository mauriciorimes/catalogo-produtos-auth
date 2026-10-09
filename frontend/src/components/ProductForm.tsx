import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../services/api'
import type { ProductFormData } from '../types'

interface ProductFormProps {
  onAddProduct: (newProductData: ProductFormData) => Promise<void>
}

const emptyForm = { title: '', description: '', price: '', imageUrl: '', isFeatured: false }

export function ProductForm({ onAddProduct }: ProductFormProps) {
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function update<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setFieldErrors({})
    try {
      await onAddProduct({ ...form, price: Number(form.price) })
      setForm(emptyForm)
    } catch (err) {
      if (err instanceof ApiError && err.issues.length > 0) {
        setFieldErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])))
      }
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass = (field: string) => `form-control${fieldErrors[field] ? ' is-invalid' : ''}`

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h2 className="h4 text-center mb-3">Adicionar Novo Produto</h2>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="title" className="form-label small">Título</label>
            <input
              id="title"
              className={inputClass('title')}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
            <div className="invalid-feedback">{fieldErrors.title}</div>
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label small">Descrição</label>
            <textarea
              id="description"
              rows={3}
              className={inputClass('description')}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
            <div className="invalid-feedback">{fieldErrors.description}</div>
          </div>

          <div className="mb-3">
            <label htmlFor="price" className="form-label small">Preço</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              className={inputClass('price')}
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
            <div className="invalid-feedback">{fieldErrors.price}</div>
          </div>

          <div className="mb-3">
            <label htmlFor="imageUrl" className="form-label small">URL da Imagem</label>
            <input
              id="imageUrl"
              placeholder="ex: images/meuproduto.png"
              className={inputClass('imageUrl')}
              value={form.imageUrl}
              onChange={(e) => update('imageUrl', e.target.value)}
            />
            <div className="invalid-feedback">{fieldErrors.imageUrl}</div>
          </div>

          <div className="form-check mb-3">
            <input
              id="isFeatured"
              type="checkbox"
              className="form-check-input"
              checked={form.isFeatured}
              onChange={(e) => update('isFeatured', e.target.checked)}
            />
            <label htmlFor="isFeatured" className="form-check-label small">
              Produto em Destaque?
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={isSaving}>
            {isSaving ? 'Salvando…' : 'Adicionar Produto'}
          </button>
        </form>
      </div>
    </div>
  )
}
