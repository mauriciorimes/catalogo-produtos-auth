import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import Header from './components/Header';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext'; // Nova importação

function App() {
    const appTitle: string = "Catálogo de Produtos Interativo";
    const subTitle: string = "Produtos carregados da nossa API (Express + Prisma + Postgres)!";

    return (
        <AuthProvider> {/* Envolvendo com AuthProvider */}
            <CartProvider>
                <div className="container-fluid bg-light min-vh-100">
                    {/* Header global com contexto do carrinho */}
                    <Header title={appTitle} subtitle={subTitle} />

                    {/* Área principal onde as rotas serão renderizadas */}
                    <main className="container">
                        <Routes>
                            {/* Rota para a página inicial */}
                            <Route path="/" element={<HomePage />} />

                            {/* Rota para a página de detalhes do produto */}
                            <Route path="/produtos/:productId" element={<ProductDetailPage />} />

                            {/* Rota para páginas não encontradas (404) */}
                            <Route
                                path="*"
                                element={
                                    <div className="text-center mt-5">
                                        <h2>404 - Página não encontrada</h2>
                                        <p>A página que você está procurando não existe.</p>
                                        <a href="/" className="btn btn-primary">Voltar para Home</a>
                                    </div>
                                }
                            />
                        </Routes>
                    </main>

                    {/* Footer global - aparece em todas as páginas */}
                    <footer className="mt-5 py-4 border-top bg-white">
                        <p className="text-center text-muted">
                            © {new Date().getFullYear()} Catálogo Interativo — Back-end próprio em Node/Express
                        </p>
                    </footer>
                </div>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
