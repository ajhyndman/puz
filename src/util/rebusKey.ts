import { InvariantError } from 'ts-invariant';

export function rebusKeyCharToNum(char: string): number {
  if (char === '0') {
    return 10;
  }
  if (/^[0-9]$/.test(char)) {
    return Number.parseInt(char);
  }
  if (/^[@#$%&+?]$/.test(char)) {
    return { '@': 11, '#': 12, $: 13, '%': 14, '&': 15, '+': 16, '?': 17 }[char]!;
  }
  if (/^[A-Z]$/.test(char)) {
    const offset = 10 + 7;
    return offset + char.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  }
  if (/^[a-z]$/.test(char)) {
    const offset = 10 + 7 + 26;
    return offset + char.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
  }

  throw new InvariantError(`encodeRebusKey: Encountered an invalid character "${char}"`);
}
