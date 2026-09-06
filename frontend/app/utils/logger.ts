type LogMethod = (...data: unknown[]) => void;

const createDevelopmentLogger = (method: keyof Console): LogMethod => (...data) => {
  if (import.meta.env.DEV) {
    const logger = console[method] as unknown as LogMethod;
    logger(...data);
  }
};

/**
 * Registro técnico para desarrollo. No escribe nada en la consola de producción.
 * No debe recibir contraseñas, tokens ni cuerpos completos de respuestas HTTP.
 */
export const developmentLogger = {
  debug: createDevelopmentLogger('debug'),
  info: createDevelopmentLogger('info'),
  warn: createDevelopmentLogger('warn'),
  error: createDevelopmentLogger('error'),
};
