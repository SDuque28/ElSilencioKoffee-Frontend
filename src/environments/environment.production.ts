import { resolveRuntimeEnv } from './runtime-env';

export const environment = {
  production: true,
  ...resolveRuntimeEnv({
    apiUrl: '/api-auth',
    authApiUrl: '/api-auth',
    isMockMode: false,
    debugApiLogging: false,
  }),
};
