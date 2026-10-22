import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: true, forbidOnly: true, retries: 0,
  reporter: 'list', workers: 2,
  use: {baseURL:'http://127.0.0.1:5297', channel:process.env.PLAYWRIGHT_CHANNEL || undefined, trace:'retain-on-failure', screenshot:'only-on-failure', reducedMotion:'reduce'},
  projects: [
    {name:'desktop', use:{browserName:'chromium', viewport:{width:1440,height:1000}}},
    {name:'phone', use:{browserName:'chromium', viewport:{width:393,height:852}}}
  ],
  webServer: {command:'npm run dev',url:'http://127.0.0.1:5297',reuseExistingServer:!process.env.CI}
});
