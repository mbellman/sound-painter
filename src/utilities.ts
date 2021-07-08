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