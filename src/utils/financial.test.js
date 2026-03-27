import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateCommission, convertUSDtoVES, RateFetchError } from './financial';

// Suite de tests para la lógica de comisiones
describe('calculateCommission', () => {
  it('debe calcular la comisión correctamente para valores estándar', () => {
    expect(calculateCommission(100000, 5)).toBe(5000);
  });

  it('debe manejar precios con decimales con precisión', () => {
    const expected = 4320.9873;
    expect(calculateCommission(123456.78, 3.5)).toBe(4320.99);
  });

  it('debe redondear correctamente casos límite de punto flotante (ej: 1.005 -> 1.01)', () => {
    expect(calculateCommission(100.5, 1)).toBe(1.01);
  });

  it('debe retornar 0 si el precio es 0', () => {
    expect(calculateCommission(0, 5)).toBe(0);
  });

  it('debe retornar 0 si el porcentaje de comisión es 0', () => {
    expect(calculateCommission(100000, 0)).toBe(0);
  });

  it('debe retornar 0 si los inputs no son números finitos', () => {
    expect(calculateCommission('abc', 5)).toBe(0);
    expect(calculateCommission(100000, 'xyz')).toBe(0);
    expect(calculateCommission(null, 5)).toBe(0);
    expect(calculateCommission(undefined, 5)).toBe(0);
    expect(calculateCommission(Infinity, 5)).toBe(0);
  });
});

// Suite de tests para la conversión de moneda
describe('convertUSDtoVES', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  beforeEach(() => {
    // Reseteamos los mocks antes de cada test
    vi.clearAllMocks();
    // Importante: reseteamos la implementación del mock para cada test
    mockSupabase.single.mockResolvedValue({ data: { valor: 36.50 }, error: null });
  });

  it('debe convertir USD a VES usando la tasa más reciente de la BD', async () => {
    const montoVES = await convertUSDtoVES(100, mockSupabase);
    expect(montoVES).toBe(3650.00);
    expect(mockSupabase.from).toHaveBeenCalledWith('tasas_bcv');
    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('debe lanzar un RateFetchError si no se puede obtener la tasa de la BD', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Fallo simulado') });
    await expect(convertUSDtoVES(100, mockSupabase)).rejects.toThrow(RateFetchError);
    await expect(convertUSDtoVES(100, mockSupabase)).rejects.toThrow('No se pudo obtener la tasa de cambio desde la base de datos.');
  });

  describe('con Caching', () => {
    beforeEach(() => {
      // Forzamos que el caché se limpie para estos tests
      convertUSDtoVES.clearCache();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debe cachear la tasa después de la primera llamada para evitar llamadas redundantes a la BD', async () => {
      // Primera llamada: debe ir a la BD
      await convertUSDtoVES(100, mockSupabase);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);

      // Segunda llamada: NO debe ir a la BD, debe usar el caché
      await convertUSDtoVES(200, mockSupabase);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // El contador no debe incrementar
    });

    it('debe refrescar el caché y consultar la BD de nuevo si el TTL ha expirado', async () => {
      vi.useFakeTimers();

      // Primera llamada
      await convertUSDtoVES(100, mockSupabase);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);

      // Avanzamos el tiempo 6 minutos (el TTL por defecto es 5)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Tercera llamada: el caché ha expirado, debe ir a la BD de nuevo
      await convertUSDtoVES(100, mockSupabase);
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });
});
