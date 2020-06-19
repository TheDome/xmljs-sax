module.exports = {
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleDirectories: ["node_modules", "lib"],
  testEnvironment: "node",
  setupFiles: [],
  verbose: true,
};
