export function isCI(): boolean {
  return !!process.env.CI;
}

/** Set PW_VIDEO=off locally for faster feedback runs; see the README. */
export function isVideoDisabled(): boolean {
  return process.env.PW_VIDEO === 'off';
}
