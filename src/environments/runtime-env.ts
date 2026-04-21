type RuntimeEnvDefaults = {
  apiUrl: string;
  authApiUrl: string;
  isMockMode: boolean;
  debugApiLogging: boolean;
};

type RuntimeEnvValues = Partial<{
  apiUrl: unknown;
  authApiUrl: unknown;
  isMockMode: unknown;
  debugApiLogging: unknown;
}>;

function getRuntimeEnvValues(): RuntimeEnvValues {
  const globalScope = globalThis as typeof globalThis & {
    __env?: RuntimeEnvValues;
  };

  return globalScope.__env ?? {};
}

function resolveString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function resolveBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].includes(normalizedValue)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
      return false;
    }
  }

  return fallback;
}

export function resolveRuntimeEnv(defaults: RuntimeEnvDefaults): RuntimeEnvDefaults {
  const runtimeEnv = getRuntimeEnvValues();

  return {
    apiUrl: resolveString(runtimeEnv.apiUrl, defaults.apiUrl),
    authApiUrl: resolveString(runtimeEnv.authApiUrl, defaults.authApiUrl),
    isMockMode: resolveBoolean(runtimeEnv.isMockMode, defaults.isMockMode),
    debugApiLogging: resolveBoolean(runtimeEnv.debugApiLogging, defaults.debugApiLogging),
  };
}
