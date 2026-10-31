// 로컬 저장소(AsyncStorage)를 메모리 mock으로 대체
// SDK 58 installs this FormData patch at app startup; Jest's Node FormData differs.
const nativeFormData = jest.requireActual('react-native/Libraries/Network/FormData').default;
const { installFormDataPatch } = jest.requireActual('expo/src/winter/FormData');
globalThis.FormData = installFormDataPatch(nativeFormData);

jest.mock('expo/fetch', () => ({ fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args) }));
jest.mock('expo-file-system', () => ({
  File: class {
    uri: string;
    constructor(uri: string) { this.uri = uri; }
    get name() { return this.uri.split('/').pop() ?? 'image.png'; }
    get type() { return this.uri.endsWith('.png') ? 'image/png' : 'image/jpeg'; }
    async bytes() { return new Uint8Array([137, 80, 78, 71]); }
  },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock 팩토리는 require만 쓸 수 있다
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
