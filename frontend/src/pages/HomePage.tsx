//src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { ProductForm } from '../components/ProductForm';
import AuthForm from '../components/AuthForm'; // Nova importação
import { useAuth } from '../contexts/AuthContext'; // Nova importação
import { useCart } from '../contexts/CartContext';
import { fetchProducts } from '../services/api';
import type { Product as ProductData, ProductFormData } from '../types';

function HomePage() {
    const [products, setProducts] = useState<ProductData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Pegando informações de autenticação
    const { user, token } = useAuth();
    const { addToCart } = useCart();

    const loadFromApi = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchProducts();
            setProducts(data);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(`Falha ao carregar produtos: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFromApi();
    }, []);

    // Função para criar produto que agora usa a API real (se autenticado)
    const handleAddProduct = async (newProductData: ProductFormData) => {
        if (!token) {
            alert('Você precisa estar logado para criar produtos!');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Enviando o token!
                },
                body: JSON.stringify(newProductData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar produto');
            }

            // Se deu certo, recarregar a lista de produtos
            alert('Produto criado com sucesso!');
            loadFromApi();

        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Erro desconhecido';
            alert(`Erro ao criar produto: ${msg}`);
        }
    };

    const handleAddToCart = (productId: number) => {
        const p = products.find(x => x.id === productId);
        if (p) addToCart(p);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleRetry = () => {
        loadFromApi();
    };

    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="container text-center mt-5">
                <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </div>
                <h2 className="mb-3">🌐 Carregando produtos...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container text-center mt-5">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">❌ Ops! Algo deu errado</h4>
                    <p className="mb-3">{error}</p>
                    <button className="btn btn-outline-danger" onClick={handleRetry}>
                        🔄 Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="row">
                {/* Coluna do formulário */}
                <div className="col-lg-4 mb-4 mb-lg-0">
                    {/* Mostrar login/registro se não estiver logado */}
                    {!user ? (
                        <section className="mb-4">
                            <AuthForm />
                        </section>
                    ) : (
                        // Mostrar formulário de produto se estiver logado
                        <section>
                            <ProductForm onAddProduct={handleAddProduct} />
                            <div className="card mt-3 p-3 shadow-sm">
                                <h6 className="text-center mb-2">Atualizar Catálogo</h6>
                                <button
                                    className="btn btn-outline-primary btn-sm w-100"
                                    onClick={handleRetry}
                                    disabled={isLoading}
                                >
                                    🔄 Recarregar da API
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Informação sobre autenticação */}
                    {!user && (
                        <div className="alert alert-info mt-3" role="alert">
                            <h6 className="alert-heading">ℹ️ Acesso Limitado</h6>
                            <small>
                                Você pode navegar e ver produtos, mas precisa fazer login
                                para criar, editar ou deletar produtos.
                            </small>
                        </div>
                    )}
                </div>

                {/* Coluna da busca e produtos */}
                <div className="col-lg-8">
                    <section className="mb-4 p-3 card shadow-sm">
                        <h3 className="mb-3 text-center">Buscar Produtos</h3>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Digite o nome do produto..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                            <span className="input-group-text">
                                <i className="bi bi-search"></i>
                            </span>
                        </div>
                    </section>

                    <section className="my-4">
                        <h2 className="text-center mb-4">
                            Nossos Produtos ({filteredProducts.length})
                        </h2>

                        <div className="row">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <div className="col-md-6 mb-4" key={product.id}>
                                        <ProductCard
                                            product={product}
                                            onAddToCart={handleAddToCart}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center">
                                    <div className="alert alert-info" role="alert">
                                        <p className="lead mb-0">
                                            {searchTerm
                                                ? `Nenhum produto encontrado para "${searchTerm}".`
                                                : "Nenhum produto disponível."}
                                        </p>
                                        {searchTerm && (
                                            <button
                                                className="btn btn-link p-0 mt-2"
                                                onClick={() => setSearchTerm('')}
                                            >
                                                Limpar busca
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
