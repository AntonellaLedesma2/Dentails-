import React, { createContext, useContext, useEffect, useReducer } from 'react';
import authService from '../services/authService';

// ─── Estado inicial ────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  token: null,
  isLoading: true,   // true mientras se verifica la sesión guardada
  isAuthenticated: false,
};

// ─── Reducer ───────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.user,
        token: action.token,
        isAuthenticated: !!action.token,
        isLoading: false,
      };
    case 'LOGIN':
      return {
        ...state,
        user: action.user,
        token: action.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
}

// ─── Contexto ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restaurar sesión al iniciar la app
  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await authService.getStoredSession();
        if (session) {
          dispatch({ type: 'RESTORE_SESSION', user: session.user, token: session.token });
        } else {
          dispatch({ type: 'RESTORE_SESSION', user: null, token: null });
        }
      } catch {
        dispatch({ type: 'RESTORE_SESSION', user: null, token: null });
      }
    }
    restoreSession();
  }, []);

  // ─── Acciones ────────────────────────────────────────────────────────────────

  async function login(identifier, password) {
    const data = await authService.login(identifier, password);

    // Si requiere 2FA, devolver el flag sin guardar sesión todavía
    if (data.twoFARequired) {
      return { twoFARequired: true, userId: data.userId };
    }

    await authService.saveSession(data.accessToken, data.refreshToken, data.user);
    dispatch({ type: 'LOGIN', user: data.user, token: data.accessToken });
    return { twoFARequired: false };
  }

  async function verifyTwoFA(userId, code) {
    const data = await authService.verifyTwoFA(userId, code);
    await authService.saveSession(data.accessToken, data.refreshToken, data.user);
    dispatch({ type: 'LOGIN', user: data.user, token: data.accessToken });
  }

  async function oauthLogin(provider, oauthId, email, nombre, apellido) {
    const data = await authService.oauthLogin(provider, oauthId, email, nombre, apellido);
    await authService.saveSession(data.accessToken, data.refreshToken, data.user);
    dispatch({ type: 'LOGIN', user: data.user, token: data.accessToken });
  }

  async function logout() {
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, verifyTwoFA, oauthLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto fácilmente
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
