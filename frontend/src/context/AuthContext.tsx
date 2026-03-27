import { 
  useState, 
  useEffect, 
  ReactNode, 
  createContext, 
  useContext 
} from 'react';
import { User } from '../types/user.types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create Context
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Provider
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredData = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      setIsLoading(false);
    };

    loadStoredData();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    const { user: loggedInUser, token: authToken } = response.data;

    setUser(loggedInUser);
    setToken(authToken);

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await authService.register({ username, email, password });
    const { user: registeredUser, token: authToken } = response.data;

    setUser(registeredUser);
    setToken(authToken);

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(registeredUser));
  };

  const logout = async () => {
    await authService.logout();

    setUser(null);
    setToken(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};