import invariant from 'ts-invariant';
import { Puzzle } from '..';
import { divideClues } from '../util/misc';
import { rebusKeyNumToChar } from '../util/rebusKey';
import { validate } from '../validate';

type LineEndingStyle = 'Windows' | 'Unix';
type Indentation = '' | '  ' | '    ' | '\t';

export function printTextFile(
  puzzle: Puzzle,
  indentation: Indentation = '\t',
  lineEndingStyle: LineEndingStyle = 'Unix',
): string {
  validate(puzzle);

  const lineEnding = lineEndingStyle === 'Windows' ? '\r\n' : '\n';

  function printLine(content?: string) {
    return `${indentation}${content ?? ''}${lineEnding}`;
  }

  // PROCESS REBUS DATA
  const { markupGrid, rebus } = puzzle;
  const needsRebusSection = markupGrid != null || rebus != null;

  let grid = puzzle.solution;
  let rebusAnnotations: string[] = [];

  // encode circled squares into grid
  if (markupGrid != null) {
    grid = grid
      .split('')
      .map((character, i) => (markupGrid[i].circled ? character.toLowerCase() : character))
      .join('');
  }

  // preprocess rebus substitutions
  if (rebus != null) {
    const { grid: rebusGrid, solution } = rebus;
    if (rebusGrid != null && solution != null) {
      Object.entries(solution).forEach(([key, substitution]) => {
        let shortSolution: string;
        let indices: number[] = [];

        // map key to single character "marker" used in text format
        const numericKey = Number.parseInt(key);
        invariant(!Number.isNaN(numericKey), `Encoded rebus keys should be numeric. Found: ${key}`);
        const charKey = rebusKeyNumToChar(numericKey);

        // find associated grid indices (and short solution)
        rebusGrid.forEach((key, i) => {
          if (key === numericKey) {
            indices.push(i);
            if (shortSolution == null) {
              shortSolution = grid[i];
            }
            invariant(
              shortSolution === grid[i],
              'Text format cannot encode multiple short solutions for a single rebus substitution',
            );
          }
        });
        invariant(
          shortSolution! != null && indices.length > 0,
          `Rebus solutions should have at least one corresponding grid entry. Key: ${key} Grid: ${rebusGrid}`,
        );

        // encode rebus substitution in grid
        grid = grid
          .split('')
          .map((character, i) => (indices.includes(i) ? charKey : character))
          .join('');

        // encode rebus substitution as annotation
        rebusAnnotations.push(`${charKey}:${substitution}:${shortSolution}`);
      });
    }
  }

  let text = '';

  // PRINT SIGNATURE
  text += '<ACROSS PUZZLE V2>' + lineEnding;

  // PRINT TITLE
  text += '<TITLE>' + lineEnding;
  text += printLine(puzzle.title);

  // PRINT AUTHOR
  text += '<AUTHOR>' + lineEnding;
  text += printLine(puzzle.author);

  // PRINT COPYRIGHT
  text += '<COPYRIGHT>' + lineEnding;
  text += printLine(puzzle.copyright);

  // PRINT SIZE
  text += '<SIZE>' + lineEnding;
  text += printLine(`${puzzle.width}x${puzzle.height}`);

  // PRINT GRID
  text += '<GRID>' + lineEnding;
  // split puzzle solution into strings of puzzle.width length
  const gridRows = grid.match(new RegExp(`.{${puzzle.width}}`, 'g'))!;
  gridRows.forEach((row) => {
    text += printLine(row);
  });

  // PRINT REBUS (Optional)
  if (needsRebusSection) {
    text += '<REBUS>' + lineEnding;
    if (puzzle.markupGrid?.some(({ circled }) => circled)) {
      text += printLine('MARK;');
    }
    rebusAnnotations.forEach((annotation) => {
      text += printLine(annotation);
    });
  }

  // PRINT CLUES
  const { across, down } = divideClues(puzzle);
  text += '<ACROSS>' + lineEnding;
  across.forEach((clue) => (text += printLine(clue)));
  text += '<DOWN>' + lineEnding;
  down.forEach((clue) => (text += printLine(clue)));

  // PRINT NOTEPAD
  if (puzzle.notepad != null) {
    text += '<NOTEPAD>' + lineEnding;
    text += puzzle.notepad + lineEnding;
  }

  return text;
}
