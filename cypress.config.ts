import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1440,
  viewportHeight: 900,
  video: true,
  screenshotOnRunFailure: true,
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    baseUrl: process.env['CYPRESS_BASE_URL'] ?? 'https://el-silencio-koffee-frontend.vercel.app',
    specPattern: 'src/pruebas/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    downloadsFolder: 'cypress/downloads',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    setupNodeEvents(on, config) {
      on('after:run', (results) => {
        if (!results) {
          return;
        }

        const outputDir = join(config.projectRoot, 'cypress', 'results');
        mkdirSync(outputDir, { recursive: true });

        const summary = {
          startedTestsAt: results.startedTestsAt,
          endedTestsAt: results.endedTestsAt,
          totalDuration: results.totalDuration,
          totalTests: results.totalTests,
          totalPassed: results.totalPassed,
          totalFailed: results.totalFailed,
          totalPending: results.totalPending,
          totalSkipped: results.totalSkipped,
          browserName: results.browserName,
          browserVersion: results.browserVersion,
          osName: results.osName,
          osVersion: results.osVersion,
          cypressVersion: results.cypressVersion,
          config: {
            baseUrl: results.config?.baseUrl ?? config.baseUrl,
            specPattern: results.config?.specPattern ?? config.e2e?.specPattern,
          },
          runs: results.runs.map((run) => ({
            spec: run.spec.relative,
            stats: run.stats,
            error: run.error ?? null,
            screenshots: run.screenshots.map((screenshot) => ({
              path: screenshot.path,
              testFailure: screenshot.testFailure,
            })),
            video: run.video ?? null,
          })),
        };

        writeFileSync(join(outputDir, 'latest-run.json'), JSON.stringify(summary, null, 2));
      });

      return config;
    },
  },
});
