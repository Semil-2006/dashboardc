module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.js"],
  transform: {
    "^.+\\.js$": "./jest.transform.js",
  },
  transformIgnorePatterns: [
    "node_modules",
    "jest\\.config\\.js",
    "jest\\.transform\\.js",
    "__tests__",
  ],
  collectCoverageFrom: [
    "static/js/**/*.js",
    "!static/js/__tests__/**",
  ],
};
