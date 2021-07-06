import { validate } from '../src';

const MINIMAL_PUZZLE = {
  height: 2,
  width: 2,
  solution: 'ABCD',
  clues: ['1A', '1D', '2D', '3A'],
};

describe('validate', () => {
  it('accepts minimum valid puzzle', () => {
    expect(() => validate(MINIMAL_PUZZLE)).not.toThrow();
  });

  it('throws if a required field is missing', () => {
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, height: undefined }),
    ).toThrowError('Puzzle is missing required field: "height"');
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, width: undefined }),
    ).toThrowError('Puzzle is missing required field: "width"');
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, solution: undefined }),
    ).toThrowError('Puzzle is missing required field: "solution"');
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, clues: undefined }),
    ).toThrowError('Puzzle is missing required field: "clues"');
  });

  it('throws if fileVersion is invalid', () => {
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, fileVersion: '1' }),
    ).toThrowError('FileVersion must match the supported format: #.#[#]');

    expect(() =>
      validate({ ...MINIMAL_PUZZLE, fileVersion: '1.2' }),
    ).not.toThrow();
  });

  it("throws if solution doesn't match dimensions", () => {
    expect(() => validate({ ...MINIMAL_PUZZLE, solution: 'A' })).toThrowError(
      'Puzzle width & height suggest solution should be 4 characters long. Found 1 characters instead.',
    );
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, solution: 'ABCDE' }),
    ).toThrowError(
      'Puzzle width & height suggest solution should be 4 characters long. Found 5 characters instead.',
    );
  });

  it('throws if solution contains invalid characters', () => {
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, solution: 'AB^D' }),
    ).toThrowError('Puzzle solution may only contain');

    expect(() =>
      validate({ ...MINIMAL_PUZZLE, solution: 'ABC;' }),
    ).toThrowError('Puzzle solution may only contain');

    expect(() =>
      validate({ ...MINIMAL_PUZZLE, solution: 'ABC-' }),
    ).toThrowError('Puzzle solution may only contain');
  });

  it("throws if state doesn't match dimensions", () => {
    expect(() => validate({ ...MINIMAL_PUZZLE, state: '-' })).toThrowError(
      'Puzzle width & height suggest state should be 4 characters long. Found 1 characters instead.',
    );
    expect(() => validate({ ...MINIMAL_PUZZLE, state: '-----' })).toThrowError(
      'Puzzle width & height suggest state should be 4 characters long. Found 5 characters instead.',
    );
  });

  it("throws if state doesn't match solution", () => {
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, solution: 'AB.D', state: '----' }),
    ).toThrowError('Black Squares in solution and state must match');
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, solution: 'ABCD', state: '-.--' }),
    ).toThrowError('Black Squares in solution and state must match');
  });

  it('throws if state contains invalid characters', () => {
    expect(() => validate({ ...MINIMAL_PUZZLE, state: 'AB^D' })).toThrowError(
      'Puzzle state may only contain',
    );
    expect(() => validate({ ...MINIMAL_PUZZLE, state: 'ABC-' })).not.toThrow();
  });

  it("throws if clues don't match solution", () => {
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, solution: '.BCD' }),
    ).toThrowError('Puzzle solution expects 2 clues, but found 4 clues');
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, clues: ['1A', '1D', '2D', '3A', 'extra'] }),
    ).toThrowError('Puzzle solution expects 4 clues, but found 5 clues');
    expect(() =>
      validate({ ...MINIMAL_PUZZLE, clues: ['1A', '1D', '2D'] }),
    ).toThrowError('Puzzle solution expects 4 clues, but found 3 clues');
  });

  describe('markupGrid', () => {
    it('accepts valid grids', () => {
      expect(() =>
        validate({
          ...MINIMAL_PUZZLE,
          markupGrid: [{}, {}, {}, {}],
        }),
      ).not.toThrow();
      expect(() =>
        validate({
          ...MINIMAL_PUZZLE,
          markupGrid: [
            {},
            { circled: true },
            { incorrect: true },
            { revealed: true },
          ],
        }),
      ).not.toThrow();
    });

    it("throws if markupGrid doesn't match solution length", () => {
      expect(() =>
        validate({ ...MINIMAL_PUZZLE, markupGrid: [] }),
      ).toThrowError('markupGrid should match puzzle solution in length');
      expect(() =>
        validate({
          ...MINIMAL_PUZZLE,
          markupGrid: [{}, {}, {}, {}, {}],
        }),
      ).toThrowError('markupGrid should match puzzle solution in length');
    });

    it('throws if there are invalid annotations', () => {
      expect(() =>
        validate({
          ...MINIMAL_PUZZLE,
          // @ts-expect-error
          markupGrid: [{}, { other: false }, {}, {}],
        }),
      ).toThrowError('markupGrid contains unsupported values');
    });
  });
});
