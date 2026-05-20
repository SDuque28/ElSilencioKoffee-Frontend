# Estrategia de pruebas automatizadas

Esta carpeta centraliza las pruebas del frontend sin mezclar responsabilidades con el codigo productivo.

## Estructura

- `unitarias`: pruebas de servicios, guards, interceptors, validadores, utilidades y componentes aislados.
- `integracion`: pruebas de paginas y componentes que coordinan formularios, servicios, router y estados de UI.
- `e2e`: pruebas Cypress contra la web publicada en Vercel.

## Comandos locales

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:all
npm run test:ci
```

Para E2E se usa por defecto:

```bash
https://el-silencio-koffee-frontend.vercel.app
```

Las credenciales admin no se guardan en el repositorio. Antes de correr E2E, define:

```bash
CYPRESS_ADMIN_USERNAME=<usuario-admin>
CYPRESS_ADMIN_PASSWORD=<password-admin>
```

El usuario regular de pruebas es unico y controlado en `cypress/fixtures/users.json`. La suite intenta registrarlo y, si ya existe, reutiliza esa misma cuenta.

## Pipeline GitHub Actions

El workflow `.github/workflows/frontend-tests.yml` se ejecuta con cada `push` a `devel` y corre:

1. `npm ci`
2. `npm run build`
3. `npm run test:unit`
4. `npm run test:integration`
5. `npm run test:e2e`

Para que E2E funcione en GitHub Actions deben existir los secretos:

- `CYPRESS_ADMIN_USERNAME`
- `CYPRESS_ADMIN_PASSWORD`

El pipeline sube artefactos Cypress si existen: screenshots, videos y resumen JSON.

## Criterios de exito

- El build Angular debe compilar sin errores.
- Todas las pruebas unitarias deben pasar.
- Todas las pruebas de integracion deben pasar.
- Todas las pruebas E2E deben pasar contra la URL publica.
- Cypress no debe depender de credenciales reales hardcodeadas ni de datos sensibles.

## Recomendaciones de ampliacion

- Agregar cobertura de formularios de registro, recuperacion y cambio de password.
- Cubrir estados vacios y errores HTTP en paginas de ordenes, productos y dashboard.
- Agregar builders compartidos para modelos complejos cuando crezca la suite.
- Mantener selectores `data-cy` para flujos criticos y evitar validaciones por textos cambiantes.
- Revisar periodicamente los datos persistidos del usuario E2E unico para evitar acumulacion de carrito u ordenes.
