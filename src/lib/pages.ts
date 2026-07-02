// Single source of truth for pages that can be shown/hidden from the public
// nav via the admin "Zichtbaarheid" screen (see /admin/zichtbaarheid and the
// PageVisibility model). Home is intentionally NOT togglable — it is always on.
//
// - `key`        : identifier stored in PageVisibility.key and passed to
//                  assertPageVisible() in the route.
// - `path`       : locale-agnostic route segment (used for the nav href).
// - `navKey`     : key in the `Nav` message namespace for the public label.
// - `adminLabel` : Dutch label shown in the admin (admin is Dutch-only).

export type PageKey =
  | "aanmelden"
  | "teams"
  | "schema"
  | "bingo"
  | "fotos"
  | "mvp"
  | "regels"
  | "venue"
  | "nickname";

export interface TogglablePage {
  key: PageKey;
  path: string;
  navKey: string;
  adminLabel: string;
}

export const TOGGLABLE_PAGES: TogglablePage[] = [
  { key: "aanmelden", path: "aanmelden", navKey: "aanmelden", adminLabel: "Aanmelden" },
  { key: "teams", path: "teams", navKey: "teams", adminLabel: "Teams" },
  { key: "schema", path: "schema", navKey: "schema", adminLabel: "Schema" },
  { key: "bingo", path: "bingo", navKey: "bingo", adminLabel: "Bingo" },
  { key: "fotos", path: "fotos", navKey: "photos", adminLabel: "Foto's" },
  { key: "mvp", path: "mvp", navKey: "mvp", adminLabel: "MVP" },
  { key: "regels", path: "regels", navKey: "rules", adminLabel: "Huisregels" },
  { key: "venue", path: "venue", navKey: "venue", adminLabel: "Locatie" },
  { key: "nickname", path: "nickname", navKey: "nickname", adminLabel: "Bijnaam-generator" },
];
