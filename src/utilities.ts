export function clamp(n: number, min: number, max: number) {
  return n < min ? min : n > max ? max : n;
}

export function mod(n: number, divisor: number): number {
  return ((n % divisor) + divisor) % divisor;
}

export function isDecimal(n: number): boolean {
  return Math.round(n) !== n;
}

export function lerp(a: number, b: number, alpha: number) {
  return a + (b - a) * alpha;
}

export function gaussian(x: number): number {
  return (Math.pow(Math.E, -Math.pow(x, 2) / 2)) / Math.sqrt(2 * Math.PI);
}

export function sum(numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

export function sort(numbers: number[]): number[] {
  return [...numbers].sort((a, b) => a > b ? 1 : a < b ? -1 : 0);
}