import { divideClues, mergeClues, rotateRows, transpose } from '../../src/util/misc';

describe('util/misc', () => {
  describe('divideClues', () => {
    it('assigns clues to across and down roles', () => {
      const puzzle = {
        width: 3,
        solution: 'ABCDEFGHI',
        clues: ['1 across', '1 down', '2 down', '3 down', '4 across', '5 across'],
      };

      expect(divideClues(puzzle)).toEqual({
        across: ['1 across', '4 across', '5 across'],
        down: ['1 down', '2 down', '3 down'],
      });
    });

    it('respects black squares when assigning clues', () => {
      const puzzle = {
        width: 3,
        solution: 'A.CDEFGHI',
        clues: ['1 down', '2 down', '3 across', '4 down', '5 across'],
      };

      expect(divideClues(puzzle)).toEqual({
        across: ['3 across', '5 across'],
        down: ['1 down', '2 down', '4 down'],
      });
    });
  });

  describe('mergeClues', () => {
    it('merges a list of across and down clues in PUZ format order', () => {
      const puzzle = {
        width: 3,
        solution: 'ABCDEFGHI',
      };
      const across = ['1 across', '4 across', '5 across'];
      const down = ['1 down', '2 down', '3 down'];

      expect(mergeClues(puzzle, across, down)).toEqual([
        '1 across',
        '1 down',
        '2 down',
        '3 down',
        '4 across',
        '5 across',
      ]);
    });

    it('reverses the behaviour of divideClues', () => {
      const puzzle = {
        width: 3,
        solution: 'ABCDEFGHI',
        clues: ['1 across', '1 down', '2 down', '3 down', '4 across', '5 across'],
      };

      const { across, down } = divideClues(puzzle);
      expect(mergeClues(puzzle, across, down)).toEqual(puzzle.clues);
    });
  });

  describe('transpose', () => {
    it('transposes square grids', () => {
      expect(transpose('ABCD', 2, 2)).toBe('ACBD');
      expect(transpose('ABCDEFGHI', 3, 3)).toBe('ADGBEHCFI');
    });

    it('transposes rectangular grids', () => {
      expect(transpose('ABCDEF', 3, 2)).toBe('ACEBDF');
      expect(transpose('ABCDEF', 2, 3)).toBe('ADBECF');
    });
  });
});

describe('rotateRows', () => {
  it('shifts rows in square grids', () => {
    expect(rotateRows('ABCD', 1, 2, 2)).toBe('BADC');
    expect(rotateRows('ABCDEFGHI', 1, 3, 3)).toBe('BCAEFDHIG');
    expect(rotateRows('ABCDEFGHIJKLMNOP', 1, 4, 4)).toBe('BCDAFGHEJKLINOPM');
    expect(rotateRows('ABCDEFGHIJKLMNOP', 2, 4, 4)).toBe('CDABGHEFKLIJOPMN');
  });

  it('shifts rows in rectangular grids', () => {
    expect(rotateRows('ABCDEFGH', 1, 4, 2)).toBe('BCDAFGHE');
    expect(rotateRows('ABCDEFGH', 2, 4, 2)).toBe('CDABGHEF');
    expect(rotateRows('ABCDEFGH', 3, 4, 2)).toBe('DABCHEFG');
    expect(rotateRows('ABCDEFGH', 1, 2, 4)).toBe('BADCFEHG');
  });

  it('supports shifts larger than the table dimensions', () => {
    expect(rotateRows('ABCDEFGHIJKLMNOP', 4, 4, 4)).toBe('ABCDEFGHIJKLMNOP');
    expect(rotateRows('ABCDEFGHIJKLMNOP', 5, 4, 4)).toBe('BCDAFGHEJKLINOPM');
  });

  it('collapses empty cells in rows that have less than width characters', () => {
    expect(rotateRows('ABCDE', 1, 3, 2)).toBe('BCAED');
    expect(rotateRows('ABCDE', 1, 2, 3)).toBe('BADCE');
    expect(rotateRows('ABCDE', 1, 3, 3)).toBe('BCAED');
  });
});
