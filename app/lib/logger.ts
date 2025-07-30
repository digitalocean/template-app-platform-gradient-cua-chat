// Minimal logger implementation for the demo
export function createLogger(name: string) {
  return {
    info: (data: unknown, message?: string) => {
      console.log(`[${name}]`, message || '', data);
    },
    error: (data: unknown, message?: string) => {
      console.error(`[${name}]`, message || '', data);
    },
    warn: (data: unknown, message?: string) => {
      console.warn(`[${name}]`, message || '', data);
    },
    debug: (data: unknown, message?: string) => {
      console.debug(`[${name}]`, message || '', data);
    }
  };
}