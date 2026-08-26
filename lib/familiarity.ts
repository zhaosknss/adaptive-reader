export function familiarityAfterLookup(current: number) {
  return Math.max(0.05, Number((current - 0.12).toFixed(2)));
}

export function familiarityAfterExposure(current: number) {
  return Math.min(0.95, Number((current + 0.02).toFixed(2)));
}
