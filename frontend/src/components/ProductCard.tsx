import { Link } from 'react-router-dom'
import type { Product as ProductData } from '../types'
import { ProductImage } from './ProductImage'

interface ProductCardProps {
  product: ProductData
  onAddToCart: (productId: number) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="card h-100 shadow-sm product-card">
      <div className="position-relative">
        <ProductImage src={product.imageUrl} alt={product.title} className="card-img-top product-img" />
        {product.isFeatured && (
          <span className="badge bg-primary position-absolute top-0 end-0 m-2">Destaque</span>
        )}
      </div>

      <div className="card-body d-flex flex-column text-center">
        <h5 className="card-title">{product.title}</h5>
        <p className="card-text text-muted small flex-grow-1">{product.description}</p>
        <p className="fw-bold fs-5 mb-3">
          R$ {Number(product.price).toFixed(2).replace('.', ',')}
        </p>

        <div className="d-flex gap-2 justify-content-center">
          <Link to={`/produtos/${product.id}`} className="btn btn-outline-primary btn-sm">
            Ver Detalhes
          </Link>
          <button className="btn btn-success btn-sm" onClick={() => onAddToCart(product.id)}>
            <i className="bi bi-cart-plus me-1"></i>Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  )
}
