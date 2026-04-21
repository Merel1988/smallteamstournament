export const FIRST_NAMES = [
  "Misty", "Rage", "Ruby", "Luna", "Vixen", "Nova", "Sassy", "Hex", "Raven",
  "Stormy", "Vicious", "Fury", "Smash", "Venus", "Jinx", "Kitty", "Blitz",
  "Pepper", "Harley", "Roxy", "Scarlet", "Bones", "Dizzy", "Frenzy", "Gloria",
  "Iron", "Joan", "Killer", "Lava", "Mercy", "Nitro", "Olive", "Pixie",
  "Queenie", "Riot", "Siren", "Trixie", "Ursa", "Velvet", "Wanda", "Yuki",
  "Zora", "Agnes", "Betty", "Dolly", "Edie", "Frida",
];

export const LAST_NAMES = [
  "Thacker", "Reaper", "Bruiser", "Basher", "Slasher", "Crusher", "Wrecker",
  "Ripper", "Killer", "Mauler", "Smasher", "Destroyer", "Skater", "Jammer",
  "Bones", "Hammer", "Rampage", "Hellfire", "Havoc", "Nightmare", "Pain",
  "Menace", "Fury", "Doom", "Vengeance", "Terror", "Wrath", "Razor",
  "McRage", "O&apos;Brawl", "Von Smash", "Skullcrusher", "Bloodshot",
  "Deadbolt", "Shockwave", "Quicksilver", "Darkside", "Thunder",
  "Lightning", "Wildfire", "Tornado",
];

export function randomNickname(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const useNumber = Math.random() < 0.3;
  const number = useNumber ? ` #${Math.floor(Math.random() * 999)}` : "";
  return `${first} ${last}${number}`;
}
