import { Puzzle } from '../src';
import { scramble, shuffle, unscramble } from '../src/scramble/scramble';
import { getCharCode } from '../src/util/misc';

const MINIMAL_PUZZLE: Puzzle = {
  height: 4,
  width: 4,
  solution: 'ABCDEFGHIJKLMNOP',
  clues: ['1A', '1D', '2D', '3D', '4D', '5A', '6A', '7A'],
};

describe.skip('shuffle', () => {
  it('handles 12 character grid', () => {
    expect(shuffle(16, 2, 'ABCDEFGHIJKL'.split('').map(getCharCode))).toEqual(
      'ABCDEFGHIJKL'.split('').map(getCharCode),
    );
  });

  // it('handles 16 character grid', () => {
  //   expect(shuffle(16, 2, MINIMAL_PUZZLE.solution.split('').map(getCharCode))).toEqual(
  //     MINIMAL_PUZZLE.solution,
  //   );
  // });

  it('rows=4 key=1 with 16 char grid', () => {
    const grid = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];

    expect(shuffle(4, 1, grid)).toEqual([1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0]);
  });

  it('rows=4 key=5 with 16 char grid', () => {
    const grid = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];

    expect(shuffle(4, 1, grid)).toEqual([1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0]);
  });
});

describe('scramble', () => {
  it('scrambles a simple puzzle', () => {
    // expect(scramble(MINIMAL_PUZZLE, '1234')).toEqual({ ...MINIMAL_PUZZLE });
    // expect(scramble(MINIMAL_PUZZLE, '4321')).toEqual({ ...MINIMAL_PUZZLE });
    expect(scramble(MINIMAL_PUZZLE, '9999')).toEqual({
      ...MINIMAL_PUZZLE,
      isScrambled: true,
      misc: {
        scrambledChecksum: 7,
      },
      solution: 'WXYZSTUVOPQRLKNM',
    });
  });

  it('preserves black square locations', () => {
    expect(scramble({ ...MINIMAL_PUZZLE, solution: 'ABCDEFGHIJKL.NO.' }, '9999')).toEqual({
      ...MINIMAL_PUZZLE,
      isScrambled: true,
      misc: {
        scrambledChecksum: 64907,
      },
      solution: 'SMNVOXYTPKUQ.LR.',
    });
  });
});

describe.skip('unscramble', () => {
  it('reverses scramble', () => {
    expect(unscramble(scramble(MINIMAL_PUZZLE, '9999'), '9999')).toEqual(MINIMAL_PUZZLE);
  });
});
