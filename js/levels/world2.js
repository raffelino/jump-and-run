/**
 * Welt 2 - Dunkle Höhlen
 * Steinige Höhlen mit Kristallen und Lava
 */

import { generateWorldLevels } from '../ProceduralLevelGenerator.js';

// Generiere 5 Level prozedural mit Seed 2000
export const world2 = generateWorldLevels(2000, "Dunkle Höhlen", 5);
