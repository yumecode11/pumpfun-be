export const floorTimestamp = (timestamp: number, minutes: number): number => {
  const fiveMinutesInMillis = minutes * 60 * 1000;
  return Math.floor(timestamp / fiveMinutesInMillis) * fiveMinutesInMillis;
};