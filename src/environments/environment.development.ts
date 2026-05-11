import { resolveRuntimeEnv } from './runtime-env';

export const environment = {
  production: false,
  ...resolveRuntimeEnv({
    apiUrl: '/api-auth',
    authApiUrl: '/api-auth',
    isMockMode: false,
    debugApiLogging: true,
  }),
};
