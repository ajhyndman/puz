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
    // rotate checksum bits one position to the right
    const leastSignificantBit = sum & 0x0001;
    sum = sum >>> 1;
    sum = sum | (leastSignificantBit << 15);

    // add next byte of data and mask to 16 bits
    return (sum + byte) & 0xffff;
  }, initialValue);
}
