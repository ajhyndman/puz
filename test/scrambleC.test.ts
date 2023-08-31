import { scrambleSolution, unscrambleSolution } from '../src/scramble/scrambleC';

describe('scrambleSolution', () => {
  it('can scramble 12 character solutions', () => {
    expect(scrambleSolution('AAAAAAAAAAAA', '1000')).toBe('BBABBACBADBB');
    expect(scrambleSolution('AAAAAAAAAAAA', '0100')).toBe('CAABAACCBBCB');
    expect(scrambleSolution('AAAAAAAAAAAA', '0010')).toBe('CABBBCBBCABA');
    expect(scrambleSolution('AAAAAAAAAAAA', '0001')).toBe('CABCABBBCCAA');
    expect(scrambleSolution('AAAAAAAAAAAA', '9999')).toBe('KKKKKKKKKKKK');
  });

  it('can scramble 16 character solutions', () => {
    expect(scrambleSolution('AAAAAAAAAAAAAAAA', '1000')).toBe('DDBCBBABCBAABAAA');
    expect(scrambleSolution('AAAAAAAAAAAAAAAA', '0100')).toBe('ABCCBCCCAABCAAAB');
    expect(scrambleSolution('AAAAAAAAAAAAAAAA', '0010')).toBe('BBBACDBBABAABCBB');
    expect(scrambleSolution('AAAAAAAAAAAAAAAA', '0001')).toBe('AABABBCABADBDCAB');
  });

  it('can scramble solutions with an odd number of characters', () => {
    expect(scrambleSolution('AAAAAAAAAAAAA', '1000')).toBe('BBABBACBADBBE');
    expect(scrambleSolution('AAAAAAAAAAAAAAA', '0100')).toBe('ABABBBACCCBCCBA');
    expect(scrambleSolution('AAAAAAAAAAAAAAAAA', '0010')).toBe('BBBACDBBABAABCBBA');
    expect(scrambleSolution('AAAAAAAAAAAAAAAAAAA', '0001')).toBe('AABADBBBAADCACAAABB');
  });

  it('can scramble a 15x15 puzzle solution', () => {
    expect(
      scrambleSolution(
        'FLAGFOCISALUTEARLRAINALONESPEAKOFTHEDEVILSPADEYAPSETETEASLEOLEXSITONTHEFENCEASHSOAPGOTONGLIBPHOTOOTTOAESOPCIRCEINSTAYTHECOURSEEPIROWRAMPCODTREEISLIPOBEDIENCESCHOOLLOUIETHEEOCTOEXPOSYOGATHAW',
        '0000',
      ),
    ).toBe(
      'REUEPOEOEUCAXHOFOFTEGNNTDIIPPELLWEEIOECOEERSOCEARNASTSEOVTCESOXGACRLOPSTIHETYUSFMELINECTLEIEORIOPARPGAHOSENTGSTCCSAOLKOAPOSEAEOIOHIBIOOEACTATENSDSNEBFLSDTASHPTATOADPTLOEOYLAIHLRALIHHOPYETEW',
    );

    expect(
      scrambleSolution(
        'FLAGFOCISALUTEARLRAINALONESPEAKOFTHEDEVILSPADEYAPSETETEASLEOLEXSITONTHEFENCEASHSOAPGOTONGLIBPHOTOOTTOAESOPCIRCEINSTAYTHECOURSEEPIROWRAMPCODTREEISLIPOBEDIENCESCHOOLLOUIETHEEOCTOEXPOSYOGATHAW',
        '7294',
      ),
    ).toBe(
      'BHYEQWEJDFPCWKGECJEGWUAYTVOYRWDHJPYKFEEQRZLXLXTJMQCOCROYRTALHPWVGQETRPLFKTUPCYBXJSCDDTBMYZBAKXQLJNXCJLVFRHHXAWGGPJYBJJKDRHAHIHMKIBJTNHDPBNPFCGROEGHUYNAIHRWPWSAGQELEKZWOOZWPTPERRNMKCSIHITPSC',
    );
  });
});

describe('unscrambleSolution', () => {
  describe('reverses scramble', () => {
    it('for a 12 character solution', () => {
      expect(unscrambleSolution(scrambleSolution('AAAAAAAAAAAA', '1000'), '1000')).toBe(
        'AAAAAAAAAAAA',
      );
      expect(unscrambleSolution(scrambleSolution('AAAAAAAAAAAA', '0100'), '0100')).toBe(
        'AAAAAAAAAAAA',
      );
      expect(unscrambleSolution(scrambleSolution('AAAAAAAAAAAA', '0010'), '0010')).toBe(
        'AAAAAAAAAAAA',
      );
      expect(unscrambleSolution(scrambleSolution('AAAAAAAAAAAA', '0001'), '0001')).toBe(
        'AAAAAAAAAAAA',
      );
    });

    it('for a 16 character solution', () => {
      // FIXME: Why does this case not pass??
      expect(unscrambleSolution(scrambleSolution('AAAAAAAAAAAAAAAA', '1000'), '1000')).toBe(
        'AAAAAAAAAAAAAAAA',
      );

      expect(unscrambleSolution(scrambleSolution('AAAAAAAAAAAAAAAA', '0100'), '0100')).toBe(
        'AAAAAAAAAAAAAAAA',
      );
      expect(unscrambleSolution(scrambleSolution('AAAAAAAAAAAAAAAA', '0010'), '0010')).toBe(
        'AAAAAAAAAAAAAAAA',
      );
      expect(unscrambleSolution(scrambleSolution('AAAAAAAAAAAAAAAA', '0001'), '0001')).toBe(
        'AAAAAAAAAAAAAAAA',
      );
    });

    it('for a 15x15 puzzle solution', () => {
      expect(
        unscrambleSolution(
          scrambleSolution(
            'FLAGFOCISALUTEARLRAINALONESPEAKOFTHEDEVILSPADEYAPSETETEASLEOLEXSITONTHEFENCEASHSOAPGOTONGLIBPHOTOOTTOAESOPCIRCEINSTAYTHECOURSEEPIROWRAMPCODTREEISLIPOBEDIENCESCHOOLLOUIETHEEOCTOEXPOSYOGATHAW',
            '7294',
          ),
          '7294',
        ),
      ).toBe(
        'FLAGFOCISALUTEARLRAINALONESPEAKOFTHEDEVILSPADEYAPSETETEASLEOLEXSITONTHEFENCEASHSOAPGOTONGLIBPHOTOOTTOAESOPCIRCEINSTAYTHECOURSEEPIROWRAMPCODTREEISLIPOBEDIENCESCHOOLLOUIETHEEOCTOEXPOSYOGATHAW',
      );

      expect(
        unscrambleSolution(
          scrambleSolution(
            'FLAGFOCISALUTEARLRAINALONESPEAKOFTHEDEVILSPADEYAPSETETEASLEOLEXSITONTHEFENCEASHSOAPGOTONGLIBPHOTOOTTOAESOPCIRCEINSTAYTHECOURSEEPIROWRAMPCODTREEISLIPOBEDIENCESCHOOLLOUIETHEEOCTOEXPOSYOGATHAW',
            '1000',
          ),
          '1000',
        ),
      ).toBe(
        'FLAGFOCISALUTEARLRAINALONESPEAKOFTHEDEVILSPADEYAPSETETEASLEOLEXSITONTHEFENCEASHSOAPGOTONGLIBPHOTOOTTOAESOPCIRCEINSTAYTHECOURSEEPIROWRAMPCODTREEISLIPOBEDIENCESCHOOLLOUIETHEEOCTOEXPOSYOGATHAW',
      );
    });
  });
});
