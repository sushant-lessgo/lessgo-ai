// buttonShape.ts

export type ButtonShape = 'rounded' | 'soft' | 'sharp' | 'ghost';

export interface ButtonShapeMapping {
  toneId: string;
  buttonShape: ButtonShape;
}

export const buttonShapeMap: ButtonShapeMapping[] = [
  {
    toneId: 'confident-playful',
    buttonShape: 'rounded', // Energetic, welcoming tone — round feels bold and fun
  },
  {
    toneId: 'minimal-technical',
    buttonShape: 'sharp', // No-frills, precise tone — square corners feel structured
  },
  {
    toneId: 'bold-persuasive',
    buttonShape: 'soft', // Slight roundness adds authority without being overly casual
  },
  {
    toneId: 'friendly-helpful',
    buttonShape: 'rounded', // Approachable and human tone — full-rounded is most inviting
  },
  {
    toneId: 'luxury-expert',
    buttonShape: 'soft', // Soft corners feel premium and elegant, not gimmicky
  },
];
