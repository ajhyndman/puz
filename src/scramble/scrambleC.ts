import invariant from 'ts-invariant';
import { CHAR_CODE_A } from '../util/constants';

const KEY_REGEX = /^[0-9]{4}$/;

function parseKey(key: number | string) {
  const stringKey = typeof key === 'string' ? key : key.toString();
  invariant(KEY_REGEX.test(stringKey));
  return stringKey.split('').map((a) => Number.parseInt(a)) as [number, number, number, number];
}

/**
 * This function attempts to directly replicate the algorithm originally
 * described and implemented in C by Brian Raiter.
 *
 * The original C implementation is included in this repository for reference.
 * You can find it at `./scramble.c`.
 *
 * @param plainText
 * Pass this function a string containing the plain text of the solution for a
 * puzzle. Black squares should already be removed.
 *
 * @param keyString
 * A four digit key formatted as a string.
 *
 * @returns The plain
 */
export function scrambleSolution(plainText: string, keyString: string) {
  const key = parseKey(keyString);
  const size = plainText.length;

  const buffer = plainText.split('').map((char) => char.charCodeAt(0) - CHAR_CODE_A);
  let tmp = buffer.slice(); // copy buffer into tmp

  let j = -1;
  for (let i = 0; i < size; i += 1) {
    j += 16;
    while (j >= size) {
      j -= size | 1;
    }
    buffer[j] = tmp[i];
  }

  for (let k = 0; k < 4; k += 1) {
    let n = 2 ** (4 - k);
    let j = -1;
    for (let i = 0; i < size; i += 1) {
      j += n;
      while (j >= size) {
        j -= size | 1;
      }
      buffer[j] = (buffer[j] + key[i % 4]) % 26;
    }

    if (n > size) {
      n -= size | 1;
    }

    for (let i = 0; i < key[k]; i += 1) {
      // rotate buffer[0..n], +1 if size % 2 == 0
      tmp = [];
      for (let j = 0; j < n; j += 1) {
        tmp.push(buffer.shift()!);
      }
      if (size % 2 === 0) {
        const last = tmp.pop()!;
        tmp.unshift(last);
      }

      // rotate buffer[0..size], -n
      buffer.push(...tmp);
    }
  }

  return buffer
    .filter((num) => num != null)
    .map((num) => String.fromCharCode(num + CHAR_CODE_A))
    .join('');
}

export function unscrambleSolution(plainText: string, keyString: string) {
  const key = parseKey(keyString);
  const size = plainText.length;

  const buffer = plainText.split('').map((char) => char.charCodeAt(0) - CHAR_CODE_A);
  let tmp: number[] = [];

  for (let k = 3; k >= 0; k -= 1) {
    let n = Math.pow(2, 4 - k);
    if (n > size) {
      n -= size | 1;
    }

    for (let i = 0; i < key[k]; i += 1) {
      tmp = [];
      // rotate buffer[0..size], +n
      for (let j = 0; j < n; j += 1) {
        tmp.unshift(buffer.pop()!);
      }

      // rotate buffer[0..n], -1 if size % 2 == 0
      if (size % 2 === 0) {
        const first = tmp.shift()!;
        tmp.push(first);
      }

      buffer.unshift(...tmp);
    }

    let j = -1;
    for (let i = 0; i < size; i += 1) {
      j += Math.pow(2, 4 - k);
      while (j >= size) {
        j -= size | 1;
      }
      buffer[j] = (buffer[j] - key[i % 4] + 26) % 26;
    }
  }

  tmp = buffer.slice(); // copy buffer into tmp

  let j = -1;
  for (let i = 0; i < size; i += 1) {
    j += 16;
    while (j >= size) {
      j -= size | 1;
    }
    buffer[i] = tmp[j];
  }

  return buffer
    .filter((num) => num != null)
    .map((num) => String.fromCharCode(num + CHAR_CODE_A))
    .join('');
}
