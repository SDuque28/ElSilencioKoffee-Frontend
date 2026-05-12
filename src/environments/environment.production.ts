import { resolveRuntimeEnv } from './runtime-env';

const RAILWAY_BACKEND_URL = 'https://elsilenciokoffee-backend-production.up.railway.app';

export const environment = {
  production: true,
  ...resolveRuntimeEnv({
    apiUrl: RAILWAY_BACKEND_URL,
    authApiUrl: RAILWAY_BACKEND_URL,
    isMockMode: false,
    debugApiLogging: false,
  }),
};
