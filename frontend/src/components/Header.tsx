// src/components/Header.tsx
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; // Nova importação

interface HeaderProps {
    title: string;
    subtitle: string;
}

function Header({ title, subtitle }: HeaderProps) {
    // Usando os hooks dos contextos
    const { totalItems: itemsCount, clearCart } = useCart();
    const { user, logout } = useAuth(); // Novo hook

    return (
        <header
            className="py-4 px-3 mb-4 text-white shadow-sm"
            style={{ backgroundColor: '#563d7c' }}
        >
            <div className="container">
                <div className="row align-items-center">
                    <div className="col-lg-6">
                        <h1 className="display-4 fw-bold">{title}</h1>
                        <p className="lead">{subtitle}</p>
                    </div>

                    <div className="col-lg-6 text-lg-end">
                        {/* Informações do usuário (se logado) */}
                        {user && (
                            <div className="d-inline-flex align-items-center bg-white text-dark px-3 py-2 rounded-pill shadow me-3 mb-2 mb-lg-0">
                                <i className="bi bi-person-circle fs-5 me-2"></i>
                                <div>
                                    <small className="d-block text-muted">Logado como</small>
                                    <strong className="fs-6">{user.name || user.email}</strong>
                                </div>
                                <button
                                    onClick={logout}
                                    className="btn btn-sm btn-outline-danger ms-2"
                                    title="Sair"
                                >
                                    <i className="bi bi-box-arrow-right"></i>
                                </button>
                            </div>
                        )}

                        {/* Indicador do carrinho */}
                        <div className="d-inline-flex align-items-center bg-white text-dark px-4 py-2 rounded-pill shadow">
                            <i className="bi bi-cart3 fs-4 me-2"></i>
                            <div>
                                <small className="d-block text-muted">Carrinho</small>
                                <strong className="fs-5">
                                    {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                                </strong>
                            </div>
                        </div>

                        {/* Botão para limpar carrinho (aparece apenas se tiver itens) */}
                        {itemsCount > 0 && (
                            <button
                                onClick={clearCart}
                                className="btn btn-sm btn-outline-light ms-2"
                                title="Limpar carrinho"
                            >
                                <i className="bi bi-trash"></i>
                            </button>
                        )}
                    </div>
                </div>

                {/* Barra de navegação */}
                <nav className="mt-3">
                    <Link to="/" className="text-white text-decoration-none me-3">
                        <i className="bi bi-house-door me-1"></i>
                        Home
                    </Link>
                </nav>
            </div>
        </header>
    );
}

export default Header;
