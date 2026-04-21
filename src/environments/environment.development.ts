import { resolveRuntimeEnv } from './runtime-env';

export const environment = {
  production: false,
  ...resolveRuntimeEnv({
    apiUrl: 'https://elsilenciokofee.com/api/v1',
    authApiUrl: '/api-auth',
    isMockMode: true,
    debugApiLogging: true,
  }),
};
