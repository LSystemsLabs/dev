/**
 * Calcula el tiempo promedio a partir de una lista de tiempos.
 */
export function calculateAverage(times: number[]): number {
  if (times.length === 0) return 0;
  const total = times.reduce((acc, curr) => acc + curr, 0);
  return total / times.length;
}

/**
 * Calcula el percentil deseado de una lista de tiempos.
 * @param times - Array de tiempos.
 * @param percentile - Percentil a calcular (por ejemplo, 90 para el 90%).
 */
export function calculatePercentile(
  times: number[],
  percentile: number
): number {
  if (times.length === 0) return 0;
  const sorted = times.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}
