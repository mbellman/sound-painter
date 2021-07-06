export function clamp(n: number, min: number, max: number) {
  return n < min ? min : n > max ? max : n;
}

export function mod(n, divisor) {
  return ((n % divisor) + divisor) % divisor;
}