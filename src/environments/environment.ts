import { resolveRuntimeEnv } from './runtime-env';

export const environment = {
  production: false,
  ...resolveRuntimeEnv({
    apiUrl: 'https://elsilenciokofee.com/api/v1',
    authApiUrl: 'http://localhost:8080',
    isMockMode: true,
    debugApiLogging: true,
  }),
};
