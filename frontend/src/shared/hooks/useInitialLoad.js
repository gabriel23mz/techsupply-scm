import { useEffect } from 'react';

/**
 * Ejecuta una carga inicial después del commit del efecto.
 *
 * El microtask evita actualizaciones de estado sincrónicas dentro del cuerpo
 * del efecto y mantiene la cancelación lógica cuando el componente se desmonta.
 */
export function useInitialLoad(load) {
  useEffect(() => {
    let active = true;

    const run = async () => {
      await Promise.resolve();

      if (active) {
        await load();
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [load]);
}

export default useInitialLoad;
