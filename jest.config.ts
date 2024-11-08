export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testMatch: ['<rootDir>/src/tests/**/*.test.ts(x)?'],
};
