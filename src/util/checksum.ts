// 16-bit bit masks
const enum BIT_MASK {
  LEAST_SIGNIFICANT_BIT = 0x0001, // 0000 0000 0000 0001
  ALL = 0xffff, // 1111 1111 1111 1111
  MOST_SIGNIFICANT_BIT = 0x8000, // 1000 0000 0000 0000
}

/**
 * Implementation of the PUZ file checksum algorithm.
 *
 * @see {@link https://github.com/ajhyndman/puz/blob/main/PUZ%20File%20Format.md#checksums}
 *
 * @param data binary data subarray to be checksummed
 * @param initialValue optional initial checksum value; can be used to combine (chain) checksums
 * @returns 16 bit
 */
export function checksum(data: Uint8Array, initialValue: number = 0x0000) {
  return data.reduce((sum, byte) => {
    // rotate sum bits to the right
    const leastSignificantBit = sum & BIT_MASK.LEAST_SIGNIFICANT_BIT;
    sum = sum >>> 1;
    if (leastSignificantBit) {
      sum = (sum | BIT_MASK.MOST_SIGNIFICANT_BIT) & BIT_MASK.ALL;
    }

    // add next byte of data and re-apply mask
    return (sum + byte) & BIT_MASK.ALL;
  }, initialValue);
}
