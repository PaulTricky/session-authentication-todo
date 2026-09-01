import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import api from '../api/api';

const AppContext = createContext(null);

// Turns an axios failure into the server's { error } string when there is one,
// so callers never have to dig through err.response themselves.
const messageFrom = (err, fallback) =>
  err?.response?.data?.error || err?.message || fallback;

export const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // checkSession is memoised with useCallback, so this runs once on mount. As a
  // plain function it would be a new reference every render, and the setState
  // calls above would retrigger the effect forever.
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const register = async ({ name, email, password }) => {
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      setUser(data.user);

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: messageFrom(err, 'Could not create your account'),
      };
    }
  };

  const login = async ({ email, password }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.user);

      return { ok: true };
    } catch (err) {
      return { ok: false, error: messageFrom(err, 'Could not sign you in') };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loadingUser,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }

  return context;
};
