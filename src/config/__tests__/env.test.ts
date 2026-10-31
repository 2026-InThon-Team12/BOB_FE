const originalMode = process.env.EXPO_PUBLIC_AI_MODE;
const originalUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
afterEach(() => {
  if (originalMode === undefined) delete process.env.EXPO_PUBLIC_AI_MODE;
  else process.env.EXPO_PUBLIC_AI_MODE = originalMode;
  if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_BASE_URL;
  else process.env.EXPO_PUBLIC_API_BASE_URL = originalUrl;
  jest.resetModules();
});
function readEnv() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../env').env;
}
it('connects to the same deployed API as the APK without a private local .env', () => {
  delete process.env.EXPO_PUBLIC_AI_MODE;
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  expect(readEnv()).toMatchObject({ aiMode: 'real', apiBaseUrl: 'https://bob-be.vercel.app' });
});
it('allows explicit mock mode and a custom backend', () => {
  process.env.EXPO_PUBLIC_AI_MODE = 'mock';
  process.env.EXPO_PUBLIC_API_BASE_URL = ' https://api.test ';
  expect(readEnv()).toMatchObject({ aiMode: 'mock', apiBaseUrl: 'https://api.test' });
});
