// 로컬 저장소(AsyncStorage)를 메모리 mock으로 대체
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock 팩토리는 require만 쓸 수 있다
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
