/**
 * Welt 3 - Brennende Wüste
 * Wüstenlandschaft mit Lava-Pools
 */

import { generateWorldLevels } from '../ProceduralLevelGenerator.js';

// Generiere 5 Level prozedural mit Seed 3000
export const world3 = generateWorldLevels(3000, "Brennende Wüste", 5);
