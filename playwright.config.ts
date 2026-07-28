import { defineConfig, devices } from '@playwright/test';
import { isCI as isCIEnv, isVideoDisabled } from './shared/helpers/environment';

const isCI = isCIEnv();

/**
 * The mobile spec is the only suite that requires an emulated device, so it is routed
 * exclusively to the mobile project. Every other spec runs once on desktop Chromium:
 * running the full suite in several browsers would slow the assignment down without
 * adding meaningful coverage for a search flow.
 */
const MOBILE_SPECS = /[\\/]responsive[\\/].*\.spec\.ts/;

/** Unit specs are pure functions: they never request the `page` fixture, so no browser starts. */
const UNIT_SPECS = /[\\/]unit[\\/].*\.spec\.ts/;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : '50%',
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  reporter: isCI
    ? [['html', { open: 'never' }], ['github'], ['list']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    /**
     * Catawiki sits behind Akamai bot protection, which answers headless browsers with
     * HTTP 403 "Access Denied" before any application markup is served. A plain HTTP
     * request from the same machine returns 200, so the block targets the headless
     * browser signature rather than the network. Tests therefore run headed locally.
     * No fingerprint spoofing or bot-detection bypass is attempted — see README.
     */
    headless: isCI,
    baseURL: 'https://www.catawiki.com/en/',
    locale: 'en-US',
    timezoneId: 'Europe/Amsterdam',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    screenshot: 'only-on-failure',
    /*
     * Video is recorded for every test and discarded when it passes, which adds a noticeable
     * pause while the browser closes. Set PW_VIDEO=off for faster local feedback runs; the
     * default keeps failure videos, which is what CI and reviewers need.
     */
    video: isVideoDisabled() ? 'off' : 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'unit',
      testMatch: UNIT_SPECS,
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [MOBILE_SPECS, UNIT_SPECS],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: MOBILE_SPECS,
    },
  ],
});
