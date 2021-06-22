import { checksum } from '../src/checksum';

describe('checksum', () => {
  // test against a few real-world header checksums
  it.each([
    ['0f0f4e0001000000', 0xea02],
    ['15158c0001000000', 0xfe04],
    ['1111520001040400', 0x1606],
    ['0f0f460001000400', 0xaa04],
    ['0f0f4e0001000000', 0xea02],
    ['0f0f4c0001000000', 0xda02],
    ['15158c0001000400', 0xfe06],
  ])('checksum of "%s" should be: %s', (hexString, value) => {
    expect(checksum(Buffer.from(hexString, 'hex'))).toBe(value);
  });
});
