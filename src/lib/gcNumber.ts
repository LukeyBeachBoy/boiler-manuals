// GC (Gas Council) numbers are 7 digits split into 3 sections: NN-NNN-NN.

/** Strip everything except digits, capped at 7. */
export function stripGcDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 7);
}

/**
 * Mask a raw input into canonical GC format (NN-NNN-NN), adding dashes
 * progressively as the user types. Non-digits are ignored.
 */
export function formatGcNumber(value: string): string {
  const d = stripGcDigits(value);
  const parts = [d.slice(0, 2)];
  if (d.length > 2) parts.push(d.slice(2, 5));
  if (d.length > 5) parts.push(d.slice(5, 7));
  return parts.filter(Boolean).join('-');
}
