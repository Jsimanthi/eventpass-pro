module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest/styleMock.js',
  },
  transformIgnorePatterns: [
    "/node_modules/(?!react-qr-scanner)",
  ]
};
