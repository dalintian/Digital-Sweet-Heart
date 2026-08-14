/**
 * Markdown profile serialization for girlfriend characters. One character =
 * one `<id>.md` file under the data directory; the file is the human-readable
 * source of truth for the persona fields and the portrait path, and it is
 * rewritten on every save.
 */
import type { Character, CharacterFormValues } from './types.ts';
export declare const AVATAR_DIR = "images";
export declare function avatarRelPath(id: string): string;
/**
 * Serialize a character into its Markdown profile.
 * @param character - the character to record.
 * @returns Markdown text.
 */
export declare function serializeCharacter(character: Character): string;
/**
 * Parse a Markdown profile back into character form values plus the portrait
 * path. Ordering of the `##` sections is free; missing sections are empty.
 * @param markdown - profile text.
 * @returns parsed values (name may be empty when the file is malformed).
 */
export declare function parseCharacter(markdown: string): CharacterFormValues & {
    avatarPath?: string;
};
/** Extract the character id embedded in a profile file. */
export declare function parseCharacterId(markdown: string): string | undefined;
//# sourceMappingURL=markdown.d.ts.map