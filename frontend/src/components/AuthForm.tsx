// src/components/AuthForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function AuthForm() {
    // Estados para controlar qual formulário mostrar
    const [isLogin, setIsLogin] = useState<boolean>(true);

    // Estados para os campos do formulário
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [name, setName] = useState<string>('');

    // Estados para feedback do usuário
    const [error, setError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Pegando as funções do contexto de autenticação
    const { login, register } = useAuth();

    // Função que processa o envio do formulário
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isLogin) {
                // Tentando fazer login
                await login({ email, password });
            } else {
                // Tentando fazer registro
                await register({ email, password, name: name || undefined });
            }

            // Se chegou até aqui, deu certo! Limpar os campos
            setEmail('');
            setPassword('');
            setName('');

        } catch (err) {
            // Se deu erro, mostrar a mensagem para o usuário
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Função para alternar entre login e registro
    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(''); // Limpar erro ao trocar de modo
    };

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-primary text-white text-center">
                <h4 className="mb-0">
                    {isLogin ? 'Fazer Login' : 'Criar Conta'}
                </h4>
            </div>

            <div className="card-body">
                {/* Mostrar erro se houver */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Campo de nome (só aparece no registro) */}
                    {!isLogin && (
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">Nome (opcional)</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>
                    )}

                    {/* Campo de email */}
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                        />
                    </div>

                    {/* Campo de senha */}
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                        />
                    </div>

                    {/* Botão de envio */}
                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                {isLogin ? 'Entrando...' : 'Criando conta...'}
                            </>
                        ) : (
                            isLogin ? 'Entrar' : 'Criar Conta'
                        )}
                    </button>
                </form>
            </div>

            {/* Rodapé com link para alternar entre login/registro */}
            <div className="card-footer text-center">
                <small className="text-muted">
                    {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                    {' '}
                    <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={toggleMode}
                    >
                        {isLogin ? 'Criar conta' : 'Fazer login'}
                    </button>
                </small>
            </div>
        </div>
    );
}

export default AuthForm;
