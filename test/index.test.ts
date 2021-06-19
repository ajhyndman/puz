import { readFileSync } from 'fs';
import { join } from 'path';

// const buffer = readFileSync(new URL('./puzzles/av110622.puz', import.meta.url));
const buffer = readFileSync(join(__dirname, './puzzles/av110622.puz'));

console.log(buffer);

describe('puz', () => {
  it('', () => {
    expect(true).toBeTruthy();
  });
});
