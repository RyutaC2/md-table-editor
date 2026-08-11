declare module 'mocha/mocha.js' {
  const mocha: {
    setup(options: { ui: 'tdd'; reporter?: undefined; timeout?: number }): void;
    run(callback: (failures: number) => void): void;
  };
  export default mocha;
}
