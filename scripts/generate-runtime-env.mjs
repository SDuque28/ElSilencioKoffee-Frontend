import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const envFilePath = resolve(projectRoot, '.env');
const runtimeEnvOutputPath = resolve(projectRoot, 'public', 'env.js');

const ENV_KEYS = {
  apiUrl: 'NG_APP_API_URL',
  authApiUrl: 'NG_APP_AUTH_API_URL',
  isMockMode: 'NG_APP_IS_MOCK_MODE',
  debugApiLogging: 'NG_APP_DEBUG_API_LOGGING',
};

function parseDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const fileContents = readFileSync(filePath, 'utf8');
  const parsedValues = {};

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key) {
      parsedValues[key] = value;
    }
  }

  return parsedValues;
}

const fileValues = parseDotEnvFile(envFilePath);

const runtimeConfig = Object.fromEntries(
  Object.entries(ENV_KEYS).flatMap(([publicKey, envKey]) => {
    const value = fileValues[envKey] ?? process.env[envKey];

    return value && value.trim() ? [[publicKey, value.trim()]] : [];
  }),
);

mkdirSync(dirname(runtimeEnvOutputPath), { recursive: true });

writeFileSync(
  runtimeEnvOutputPath,
  `window.__env = ${JSON.stringify(runtimeConfig, null, 2)};\n`,
  'utf8',
);

console.info(`[runtime-env] Generated ${runtimeEnvOutputPath}`);
