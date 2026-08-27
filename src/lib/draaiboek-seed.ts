// Default posts for the Small Teams Tournament runsheet, taken from the
// organisers' draaiboek. Seeded once when the VolunteerTask table is empty.
// Times are "HH:MM" on event day; converted to minutes on insert.

export type SeedShift = [from: string, to: string, need: number];
export type SeedTask = {
  area: "zaal" | "kantine" | "officials" | "algemeen";
  name: string;
  shifts: SeedShift[];
  info?: string[];
};

// 12 pool games of 20 min with 5 min turnaround from 12:00, then a final at 17:30.
// Used to create per-game shifts for NSO crew, refs and the announcer.
export const DEFAULT_GAME_STARTS: string[] = Array.from({ length: 12 }, (_, i) => {
  const m = 12 * 60 + i * 25;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}).concat(["17:30"]);

const perGame = (need: number): SeedShift[] =>
  DEFAULT_GAME_STARTS.map((s) => {
    const [h, m] = s.split(":").map(Number);
    const start = h * 60 + m - 5;
    const end = h * 60 + m + 20;
    const f = (x: number) =>
      `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
    return [f(start), f(end), need];
  });

export const DEFAULT_TASKS: SeedTask[] = [
  { area: "zaal", name: "Track tapen", shifts: [["09:00", "11:00", 5]], info: ["Zaaltape en toebehoren klaar", "Instructies afstemmen met head ref", "Overweeg vrijdagavond, scheelt de hele ochtend"] },
  { area: "zaal", name: "Papierwerk & materiaal meenemen", shifts: [["09:00", "09:30", 1]], info: ["Speelschema", "Poule-indeling", "Ref-materiaal", "NSO-materiaal", "Stopwatches"] },
  { area: "zaal", name: "Zaal opzetten", shifts: [["09:00", "11:00", 4]], info: ["Penalty box opbouwen", "Papierwerk klaarleggen", "Stopwatches klaarleggen", "Banken teams klaarzetten", "Inside white board"] },
  { area: "zaal", name: "Kleedkamers klaarmaken", shifts: [["09:00", "10:00", 1]], info: ["Kleedkamers aanduiden en beplakken per team"] },
  { area: "zaal", name: "Scorebord & beamer", shifts: [["09:00", "10:30", 2]], info: ["Scorebordspullen klaarzetten", "Laptop en beamer mee", "Testen vóór captains meeting"] },
  { area: "zaal", name: "Banner & PR in zaal", shifts: [["09:00", "10:00", 1]], info: ["Banner ophangen"] },
  { area: "zaal", name: "Captains meeting", shifts: [["11:00", "11:15", 1]], info: ["Huisregels", "Speelschema doornemen"] },
  { area: "zaal", name: "Zaalcoördinator tijdens toernooi", shifts: [["12:00", "18:00", 1]], info: ["Aanspreekpunt zaal", "Bewaakt de tijd van het speelschema"] },
  { area: "zaal", name: "Prijsuitreiking", shifts: [["17:45", "18:00", 1]], info: ["Prijzen top 3 klaarleggen", "Foto winnaars"] },
  { area: "zaal", name: "Opruimen zaal", shifts: [["18:00", "19:00", 4]], info: ["Track weghalen", "Banken, scorebord, papieren, stopwatch, beamer, laptop", "Kleedkamers leeg", "Vuilniszakken", "Laatste controle zaal en kleedkamers"] },
  { area: "officials", name: "Officials meeting", shifts: [["11:15", "12:00", 1]], info: ["Zaal en materiaal beschikbaar"] },
  { area: "officials", name: "NSO-crew", shifts: perGame(7), info: ["Twee crews, wisselen per wedstrijd", "Papierwerk en stopwatches bij penalty box"] },
  { area: "officials", name: "Refs", shifts: perGame(4), info: ["Twee crews, wisselen per wedstrijd"] },
  { area: "officials", name: "Lunch refs & NSO's klaarzetten", shifts: [["12:30", "13:30", 2]], info: ["2x vegan groentesoep", "1x vegan pastasalade (15 personen)", "6 zakken volkoren bolletjes", "Smeerboter, kaas, hummus", "2 komkommers, 4 tomaten snijden", "Borden en bestek", "Drinken staat klaar in hun eigen ruimte, niet aan de bar"] },
  { area: "kantine", name: "Kas & pin klaarmaken", shifts: [["09:00", "09:30", 1]], info: ["Kas tellen en controleren", "Pinapparaat mee en testen, ontvangst valt regelmatig weg in de kantine", "App installeren voor pinapparaat"] },
  { area: "kantine", name: "Gastenlijsten mee", shifts: [["09:00", "09:30", 1]], info: ["Lijst aanmelding teams", "Lijst vrijwilligers", "Lijst ref/NSO"] },
  { area: "kantine", name: "Inruimen bar", shifts: [["09:00", "12:00", 2]], info: ["Koffie en thee voor vroege vogels", "Fris en drank koud zetten", "Prijslijsten drankjes ophangen"] },
  { area: "kantine", name: "Merchandise opbouwen", shifts: [["09:00", "10:00", 1]], info: ["Tafels en stoelen klaarzetten", "Prijslijsten merchandise", "Bijhouden verkochte items"] },
  { area: "kantine", name: "Tombola opbouwen", shifts: [["09:00", "10:00", 1]], info: ["Tafel opbouwen", "Tickets klaarleggen", "Verkoop tickets kan ook aan de bar"] },
  { area: "kantine", name: "Entree opbouwen", shifts: [["09:00", "10:00", 2]], info: ["Tafel neerzetten", "Beachvlaggen buiten", "Programma ophangen"] },
  { area: "kantine", name: "Ontvangst & entree", shifts: [["10:30", "12:00", 2]], info: ["Aftekenen teams, vrijwilligers, ref en NSO", "Toeschouwers € 5,- entree", "Kas en pin paraat, we hebben er maar één", "Naar kleedkamers verwijzen", "Vrijwilligers opvangen"] },
  { area: "kantine", name: "Entree tijdens de dag", shifts: [["12:00", "16:00", 1]], info: ["Voor publiek dat later binnenkomt"] },
  { area: "kantine", name: "Bar & keuken", shifts: [["12:00", "14:00", 2], ["14:00", "16:00", 2], ["16:00", "17:30", 2], ["17:30", "19:00", 2]], info: ["Altijd twee personen achter de bar", "Eten uitstallen (betaald)", "Koffie en thee gratis voor vrijwilligers, gasten betalen", "Vijf tot tien minuten eerder aanwezig voor de overdracht"] },
  { area: "kantine", name: "Merch & tombola verkoop", shifts: [["12:00", "15:00", 1], ["15:00", "18:00", 1]], info: ["Verkochte items bijhouden"] },
  { area: "kantine", name: "Kas afromen", shifts: [["14:00", "14:15", 1], ["16:30", "16:45", 1]], info: ["Afgeroomd geld naar de vaste plek achter de bar", "Voorkomt veel contant geld in de kassa"] },
  { area: "kantine", name: "Opruimen kantine", shifts: [["19:00", "21:00", 4]], info: ["Bar schoonmaken", "Boodschappen inladen, basketbaldrinken terugzetten", "Vuilniszakken verwisselen", "Vloer vegen", "Merch en tombola opruimen"] },
  { area: "algemeen", name: "Medic / EHBO", shifts: [["11:30", "15:00", 1], ["15:00", "18:15", 1]], info: ["EHBO-tas en ijs klaar op vaste plek", "AED-locatie in de zaal kennen", "Injury reports klaarleggen", "Afspreken wie 112 belt en wie de ambulance opvangt"] },
  { area: "algemeen", name: "Announcer", shifts: perGame(1), info: ["Namenlijst en poule-indeling bij de hand", "Microfoon testen voor 12:00"] },
  { area: "algemeen", name: "Muziek / DJ", shifts: [["12:00", "15:00", 1], ["15:00", "18:00", 1]], info: ["Playlist en aansluiting testen"] },
  { area: "algemeen", name: "Fotografie", shifts: [["12:00", "15:00", 1], ["15:00", "18:00", 1]], info: ["Afstemmen wat online mag, toestemming spelers"] },
  { area: "algemeen", name: "Bingo begeleiden", shifts: [["12:00", "18:00", 1]], info: ["Kaarten uitdelen", "Prijs voor volle kaart"] },
  { area: "algemeen", name: "Brieven vrijwilligers uitdelen", shifts: [["11:30", "11:45", 1]], info: ["Tijdsindeling per persoon doornemen"] },
  { area: "algemeen", name: "Kassen tellen", shifts: [["21:00", "21:30", 1]], info: ["Penningmeester", "Kassen mee en tellen"] },
];

export const toMinutes = (s: string): number => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

export type SeedItem = {
  kind: "prep" | "issue" | "role";
  fase?: string;
  text: string;
  note?: string;
};

export const PREP_PHASES = ["April tot juni", "Juli", "Augustus tot september", "Oktober", "November", "Na afloop"];

const P = (fase: string, text: string, note = ""): SeedItem => ({ kind: "prep", fase, text, note });
const I = (text: string): SeedItem => ({ kind: "issue", text });
const R = (fase: string, text: string): SeedItem => ({ kind: "role", fase, text });

export const DEFAULT_ITEMS: SeedItem[] = [
  I("Pauze: draaiboek zegt 14:30 tot 15:00, de site zegt een half uur vóór de finale. Kies er één."),
  I("Captains om 11:00 en officials om 11:15 (draaiboek), of officials om 11:00 (site)? En ontvangst loopt tot 12:00 terwijl captains er om 11:00 moeten zijn."),
  I("18:00 is nu einde toernooi én prijsuitreiking. Communiceer je 12 tot 18 uur, dan verwacht publiek dat het dan klaar is."),
  I("13 wedstrijden à 20 min plus een half uur pauze past maar krap in 12:00 tot 18:00. Voorleggen aan head ref en head NSO."),
  I("Teamgrootte: max 8 spelers plus 2 bench crew (draaiboek) of minimaal 8 plus 2 wisselspelers (site)? Teams rekenen hierop."),
  I("Tot hoe laat is de zaal én de kantine gehuurd? Opruimen loopt tot 21:00."),
  I("Alcohol schenken: welke vergunning hangt eronder, en moet er iemand met Sociale Hygiëne of IVA aanwezig zijn?"),
  I("Toestemming spelers voor headshots en foto's op de openbare site."),
  I("Contactlijst voor de dag: sleutel, zaalbeheerder, bereikbaarheid bij calamiteiten."),
  I("Track tapen: vrijdagavond of zaterdagochtend?"),
  P("April tot juni", "Organisatie en vrijwilligers verzamelen", "Bij de ALV vragen wie in de organisatie wil"),
  P("April tot juni", "Eerste bijeenkomst", "Datum, zaal, kantine, budget, opzet, side events, taakverdeling"),
  P("April tot juni", "Save the date bij Interleague", "Voorkomt dubbele derby-events, belangrijk voor ref- en NSO-beschikbaarheid"),
  P("Juli", "Mails leagues versturen", "Bijlage 3, met aanmelddeadline"),
  P("Juli", "Oproep ref en NSO", "Bijlage 4, Facebook NL en Duitsland/België"),
  P("Juli", "Oproep medics", "Via Facebook en leagues"),
  P("Juli", "Oproep announcer"),
  P("Juli", "Opzet catering bedenken", "Bijlage 2"),
  P("Augustus tot september", "Aanmeldingen leagues bijhouden", "In het Excel-bestand"),
  P("Augustus tot september", "Namen en headshots opvragen", "Let op toestemming voor publicatie op de site"),
  P("Augustus tot september", "Inschrijving bevestigen"),
  P("Augustus tot september", "Betalingen bijhouden", "Penningmeester"),
  P("Augustus tot september", "Stand van zaken ref, NSO, medics, announcer"),
  P("Augustus tot september", "Roadkill vrijwilligers inventariseren", "Vul ze in bij het tabblad Vrijwilligers"),
  P("Augustus tot september", "Oproep spelers Roadkill", "Teamcaptain, ook Market Gardeners"),
  P("Augustus tot september", "Boutboekjes: vrijwilliger en drukker regelen"),
  P("Augustus tot september", "PR: Facebook-event en groepen", "Roller Derby NL, Roller Derby Germany NETT-WERK"),
  P("Oktober", "Laatste check namen en headshots"),
  P("Oktober", "Poule-indeling maken", "Teams worden op de site vanaf oktober bekendgemaakt"),
  P("Oktober", "Speelschema definitief maken", "Afstemmen met head ref en head NSO, daarna op de site"),
  P("Oktober", "Tijdschema en taakverdeling dag zelf", "Dit is het tabblad Draaiboek dag"),
  P("Oktober", "Betalingen afronden", "Uiterlijk 1 november of op de dag zelf, besluiten"),
  P("Oktober", "Boutboekjes naar de drukker", "Check de levertijd"),
  P("Oktober", "Merchandise bijbestellen", "Besteltijd en druktijd meerekenen"),
  P("November", "Inventarisatie materiaal", "Zaaltape, ref-materiaal, NSO-materiaal"),
  P("November", "Prijzen regelen"),
  P("November", "Catering: eten halen"),
  P("November", "Voorraad bar checken en bijhalen"),
  P("November", "Printen", "Prijslijsten, aanmeldingen, kleedkamerbeplakking, speelschema, poule-indeling, gastenlijsten, vrijwilligersbriefjes"),
  P("November", "Laatste mail naar deelnemers", "Huisregels, programma, aankomsttijd"),
  P("Na afloop", "Evaluatie plannen", "Zo snel mogelijk na het event"),
  P("Na afloop", "Input evaluatie opvragen", "Contactpersoon teams en contactpersoon ref/NSO"),
  P("Na afloop", "Evalueren", "Ongeveer twee weken na het event"),
  P("Na afloop", "Eindverslag maken", "Organisator"),
  P("Na afloop", "Financiële afronding", "Penningmeester, terugkoppeling op de ALV"),
  R("Voorbereiding", "Coördinator kantine"), R("Voorbereiding", "Draaiboek, geldzaken, bestuurslid"),
  R("Voorbereiding", "Coördinator zaal"), R("Voorbereiding", "Ref en NSO, bestuurslid"),
  R("Voorbereiding", "Algemeen, contact Job, PR"), R("Voorbereiding", "Algemeen, catering"),
  R("Voorbereiding", "Algemeen, kantine"), R("Voorbereiding", "Side events, tombola en merch"),
  R("Voorbereiding", "Algemeen, PR"), R("Voorbereiding", "Begeleiding, oud-organisator"),
  R("Voorbereiding", "Contact met teams via Interleague"), R("Voorbereiding", "Beheer website en socials"),
  R("Op de dag", "Coördinator algemeen"), R("Op de dag", "Coördinator zaal"),
  R("Op de dag", "Coördinator kantine"), R("Op de dag", "Ref en NSO, bestuurslid"),
  R("Op de dag", "Catering"), R("Op de dag", "Side events"),
  R("Op de dag", "Penningmeester, kas en pin"), R("Op de dag", "Medic"),
  R("Op de dag", "Announcer"), R("Op de dag", "Overige vrijwilligers aansturen"),
];
