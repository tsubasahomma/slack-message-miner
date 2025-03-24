export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getUnixTimestamp = () => Math.floor(Date.now() / 1000);

export const log = (msg: string, category = 'general', isError = false) => {
  const prefix = `[${category}]`;
  isError ? console.error(`${prefix} ${msg}`) : console.log(`${prefix} ${msg}`);
};
