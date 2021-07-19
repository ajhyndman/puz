import { invariant, InvariantError } from 'ts-invariant';

export function rebusKeyCharToNum(char: string): number {
  let num;

  if (char === '0') {
    num = 10;
  } else if (/^[0-9]$/.test(char)) {
    num = Number.parseInt(char);
  } else if (/^[@#$%&+?]$/.test(char)) {
    num = { '@': 11, '#': 12, $: 13, '%': 14, '&': 15, '+': 16, '?': 17 }[char]!;
  } else if (/^[A-Z]$/.test(char)) {
    const offset = 10 + 7;
    num = offset + char.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  } else if (/^[a-z]$/.test(char)) {
    const offset = 10 + 7 + 26;
    num = offset + char.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
  }

  invariant(num != null, `encodeRebusKey: Encountered an invalid character "${char}"`);

  // shift numeric key by 1 to support 0 index
  return num - 1;
}

export function rebusKeyNumToChar(num: number): string {
  // shift numeric key by 1 to support 0 index
  num += 1;

  if (1 <= num && num <= 9) {
    return num.toString();
  }
  if (num === 10) {
    return '0';
  }
  if (11 <= num && num <= 17) {
    return { 11: '@', 12: '#', 13: '$', 14: '%', 15: '&', 16: '+', 17: '?' }[num]!;
  }

  // TODO: support encoding as characters that are not already in use in puzzle

  throw new InvariantError(`encodeRebusKey: Encountered an unsupported rebus key "${num}"`);
}
