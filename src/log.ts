export function log(...args: any[]) {
  const now = new Date();
  const prefix = `[${now.toISOString()}]`;
  console.log(prefix, ...args);
}
