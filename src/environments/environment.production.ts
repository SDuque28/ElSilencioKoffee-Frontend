import { resolveRuntimeEnv } from './runtime-env';

export const environment = {
  production: true,
  ...resolveRuntimeEnv({
    apiUrl: 'https://elsilenciokofee.com/api/v1',
    authApiUrl: 'http://localhost:8080',
    isMockMode: true,
    debugApiLogging: false,
  }),
};
