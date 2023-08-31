import { Puzzle } from '../src';
import { scramble, unscramble } from '../src/scramble/scramble';

const MINIMAL_PUZZLE: Puzzle = {
  height: 4,
  width: 4,
  solution: 'ABCDEFGHIJKLMNOP',
  clues: ['1A', '1D', '2D', '3D', '4D', '5A', '6A', '7A'],
  isScrambled: false,
  misc: {
    scrambledChecksum: undefined,
  },
};

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
      solution: 'ZLMNKPOQSTUVWXYR',
    });
  });

  it('preserves black square locations', () => {
    expect(scramble({ ...MINIMAL_PUZZLE, solution: 'ABCDEFGHIJKL.NO.' }, '9999')).toEqual({
      ...MINIMAL_PUZZLE,
      isScrambled: true,
      misc: {
        scrambledChecksum: 64907,
      },
      solution: 'MQTYUPKNRLVO.SX.',
    });
  });
});

describe('unscramble', () => {
  it('reverses scramble', () => {
    expect(unscramble(scramble(MINIMAL_PUZZLE, '9999'), '9999')).toEqual(MINIMAL_PUZZLE);
  });
  it('reverses scramble', () => {
    expect(unscramble(scramble(MINIMAL_PUZZLE, '0000'), '0000')).toEqual(MINIMAL_PUZZLE);
  });
  it('reverses scramble', () => {
    expect(unscramble(scramble(MINIMAL_PUZZLE, '1000'), '1000')).toEqual(MINIMAL_PUZZLE);
  });
  it('reverses scramble', () => {
    expect(unscramble(scramble(MINIMAL_PUZZLE, '4729'), '4729')).toEqual(MINIMAL_PUZZLE);
  });
  it('reverses scramble', () => {
    const puzzle = { ...MINIMAL_PUZZLE, solution: 'ABCDEFGHIJKL.NO.' };
    expect(unscramble(scramble(puzzle, '4729'), '4729')).toEqual(puzzle);
  });
});
