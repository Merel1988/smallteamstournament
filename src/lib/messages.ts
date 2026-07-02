import { parse } from "@formatjs/icu-messageformat-parser";

export type MessageTree = { [key: string]: string | MessageTree };

/**
 * Load the base messages shipped in messages/{locale}.json.
 */
export async function loadBaseMessages(locale: string): Promise<MessageTree> {
  return (await import(`../../messages/${locale}.json`)).default as MessageTree;
}

/**
 * Flatten a nested message tree into dotted-path leaf entries.
 * { Home: { cards: { teams: "Teams" } } } -> { "Home.cards.teams": "Teams" }
 * Only string leaves are emitted (the editable values).
 */
export function flattenMessages(
  tree: MessageTree,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out[path] = v;
    } else if (v && typeof v === "object") {
      Object.assign(out, flattenMessages(v, path));
    }
  }
  return out;
}

/**
 * Set a value at a dotted path inside a tree, creating intermediate objects.
 * Silently ignores a path segment that collides with an existing string leaf.
 */
function setDeep(tree: MessageTree, dottedKey: string, value: string): void {
  const parts = dottedKey.split(".");
  let node: MessageTree = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = node[part];
    if (typeof next === "object" && next !== null) {
      node = next;
    } else if (next === undefined) {
      const created: MessageTree = {};
      node[part] = created;
      node = created;
    } else {
      // A string sits where we need an object — cannot place this override.
      return;
    }
  }
  node[parts[parts.length - 1]] = value;
}

/**
 * Deep-clone a message tree (plain JSON, so structuredClone-free clone is fine).
 */
function cloneTree(tree: MessageTree): MessageTree {
  return JSON.parse(JSON.stringify(tree)) as MessageTree;
}

/**
 * Returns true if `value` is a parseable ICU message string. Empty strings and
 * plain text are valid; malformed ICU (unbalanced braces, bad plural) is not.
 */
export function isValidIcu(value: string): boolean {
  try {
    parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Merge DB overrides onto the base tree. Each override replaces the leaf at its
 * dotted path. Overrides whose value is not valid ICU are skipped so a broken
 * edit can never crash the public site — the base value stays in place.
 */
export function applyOverrides(
  base: MessageTree,
  overrides: { key: string; value: string }[],
): MessageTree {
  const merged = cloneTree(base);
  for (const { key, value } of overrides) {
    if (!isValidIcu(value)) continue;
    setDeep(merged, key, value);
  }
  return merged;
}
