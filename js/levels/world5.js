/**
 * Welt 5 - Himmelsburg
 * Schwebende Inseln hoch in den Wolken
 */

import { generateWorldLevels } from '../ProceduralLevelGenerator.js';

// Generiere 5 Level prozedural mit Seed 5000
export const world5 = generateWorldLevels(5000, "Himmelsburg", 5);
