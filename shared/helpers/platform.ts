/** Select-all uses Meta on macOS and Control everywhere else. */
export function getSelectAllShortcut(): string {
  return process.platform === 'darwin' ? 'Meta+a' : 'Control+a';
}
