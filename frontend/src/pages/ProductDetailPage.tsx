// src/pages/ProductDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ProductImage } from '../components/ProductImage';
import { ApiError, fetchProductById } from '../services/api';
import type { Product as ProductData } from '../types';

export function ProductDetailPage() {
  // Hook do React Router para pegar parâmetros da URL
  const { productId } = useParams<{ productId: string }>();

  // Hook do contexto do carrinho
  const { addToCart } = useCart();

  // Estados para gerenciar os dados
  const [product, setProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar um produto específico
  const load = async (idNum: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchProductById(idNum);
      setProduct(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      // Se o backend devolveu 404, a handle() lança um ApiError com status 404
      const notFound = err instanceof ApiError && err.status === 404;
      setError(notFound ? 'Produto não encontrado' : `Falha ao carregar o produto: ${msg}`);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) return;
    const idNum = Number(productId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      setError('ID inválido');
      setIsLoading(false);
      return;
    }
    load(idNum);
  }, [productId]);

  // Handler para adicionar ao carrinho (versão simples, com Context)
  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      console.log(`🛒 Adicionado ao carrinho: ${product.title}`);
    }
  };

  // Renderização condicional
  if (isLoading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-3">Carregando produto…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container">
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>{error ?? 'Produto não encontrado'}</span>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-danger btn-sm" onClick={() => load(Number(productId))}>
              Tentar de novo
            </button>
            <Link to="/" className="btn btn-outline-secondary btn-sm">Voltar ao catálogo</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="row">
        {/* Imagem */}
        <div className="col-lg-6 mb-4">
          <div className="card">
            <ProductImage
              src={product.imageUrl}
              alt={product.title}
              className="card-img-top"
              style={{
                maxHeight: '500px',
                objectFit: 'contain',
                padding: '20px'
              }}
            />
          </div>
        </div>

        {/* Informações */}
        <div className="col-lg-6">
          <h1 className="h2 mb-3">{product.title}</h1>

          <div className="mb-4">
            <h3 className="text-success">
              R$ {Number(product.price).toFixed(2).replace('.', ',')}
            </h3>
          </div>

          <div className="mb-4">
            <h5>Descrição</h5>
            <p className="text-muted">{product.description}</p>
          </div>

          {product.isFeatured && (
            <span className="badge bg-primary mb-3">Destaque</span>
          )}

          <div className="d-flex gap-3 mb-4">
            <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
              🛒 Adicionar ao carrinho
            </button>
            <Link to="/" className="btn btn-outline-secondary btn-lg">
              Voltar
            </Link>
          </div>

          <p className="text-muted small">
            Cadastrado em {new Date(product.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
