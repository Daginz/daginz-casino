import { Injectable } from '@nestjs/common';
import type { GameDefinition } from './game-definition';

/** DI token for the game registry. */
export const GAME_REGISTRY = Symbol('GAME_REGISTRY');

/**
 * Holds all registered GameDefinitions, keyed by id. The engine looks games up
 * here; modules register their game(s) at construction. New game = one register
 * call, zero engine edits.
 */
@Injectable()
export class GameRegistry {
  private readonly games = new Map<string, GameDefinition>();

  register(def: GameDefinition): void {
    if (this.games.has(def.id)) {
      throw new Error(`Game already registered: ${def.id}`);
    }
    this.games.set(def.id, def);
  }

  get(id: string): GameDefinition | undefined {
    return this.games.get(id);
  }

  list(): Array<{ id: string; displayName: string }> {
    return [...this.games.values()].map((g) => ({ id: g.id, displayName: g.displayName }));
  }
}
