import { useState, useCallback } from 'react';

/**
 * Hook para manejar llamadas a la API con estados de loading y error.
 *
 * @param {Function} apiFn - Función async que llama a la API
 * @returns {{ execute, data, loading, error }}
 *
 * Uso:
 *   const { execute, data, loading, error } = useApi(userService.getAll);
 *   useEffect(() => { execute(); }, []);
 */
export default function useApi(apiFn) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Error inesperado';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { execute, data, loading, error };
}
