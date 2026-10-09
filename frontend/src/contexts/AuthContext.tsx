import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Definindo a estrutura do usuário que vem da API
interface User {
    id: number;
    email: string;
    name?: string;
}

// Dados necessários para login
interface LoginData {
    email: string;
    password: string;
}

// Dados necessários para registro
interface RegisterData {
    email: string;
    password: string;
    name?: string;
}

// O "contrato" do nosso contexto de autenticação
interface AuthContextType {
    user: User | null;           // null = não logado, User = logado
    token: string | null;        // Token JWT para as requisições
    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

// Criando o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Componente Provider que envolverá nossa aplicação
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Ao carregar a aplicação, verificar se existe token salvo
    useEffect(() => {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    // Função para fazer login
    const login = async (data: LoginData) => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro no login');
            }

            const result = await response.json();

            // Salvar token e usuário
            setToken(result.token);
            setUser(result.user);
            localStorage.setItem('auth_token', result.token);
            localStorage.setItem('auth_user', JSON.stringify(result.user));

        } finally {
            setIsLoading(false);
        }
    };

    // Função para registro
    const register = async (data: RegisterData) => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro no registro');
            }

            const result = await response.json();

            // Após registro bem-sucedido, já logar o usuário
            setToken(result.token);
            setUser(result.user);
            localStorage.setItem('auth_token', result.token);
            localStorage.setItem('auth_user', JSON.stringify(result.user));

        } finally {
            setIsLoading(false);
        }
    };

    // Função para logout
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    const contextValue: AuthContextType = {
        user,
        token,
        login,
        register,
        logout,
        isLoading
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personalizado para usar o contexto
export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }

    return context;
}
