import { Buffer } from 'buffer';
import { checksum } from '../src/util/checksum';
import { EMPTY_BUFFER } from '../src/util/constants';

describe('checksum', () => {
  it('returns initialValue for empty data array', () => {
    expect(checksum(EMPTY_BUFFER)).toBe(0x0000);
    expect(checksum(EMPTY_BUFFER, 0x1111)).toBe(0x1111);
    expect(checksum(EMPTY_BUFFER, 0xffff)).toBe(0xffff);
  });

  // test against a few real-world header checksums
  it.each([
    ['0f0f4e0001000000', 0xea02],
    ['15158c0001000000', 0xfe04],
    ['1111520001040400', 0x1606],
    ['0f0f460001000400', 0xaa04],
    ['0f0f4e0001000000', 0xea02],
    ['0f0f4c0001000000', 0xda02],
    ['15158c0001000400', 0xfe06],
  ])('checksum ("%s") matches expected value: %s', (hexString, value) => {
    expect(checksum(Buffer.from(hexString, 'hex'))).toBe(value);
  });

  describe('chained calls', () => {
    it('return equivalent checksum to concatenated data', () => {
      const a = Buffer.from('0f0f4e0001000000', 'hex');
      const b = Buffer.from('15158c0001000000', 'hex');

      const chainedChecksum = checksum(b, checksum(a));
      const concatenatedChecksum = checksum(Buffer.concat([a, b]));

      expect(chainedChecksum).toBe(concatenatedChecksum);
    });
  });
});
