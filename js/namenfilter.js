// Haalt persoonsnamen uit het onderwerp van een reservering voor het op de pagina komt.
// Let op: dit is enkel weergave. De API zelf geeft het volledige onderwerp nog altijd terug.
//
// Aanvullen: staat er toch een naam op de pagina, voeg de voornaam (kleine letters, zonder
// accenten) toe aan VOORNAMEN, of voeg een regel toe aan VERVANG.

// Onderwerpen die altijd over één persoon of firma gaan: enkel de soort tonen.
const VERVANG = [
  [/^flex\s*plek\b.*/i, "Flexplek"],
];

// Een woord dat hierop eindigt, is een straat en geen achternaam (bv. "Edward Verheyestraat").
const STRAAT = /(straat|laan|plein|weg|dreef|lei|kaai|park|pad|dijk|singel|hof)$/i;

const VOORNAMEN = new Set(`
  aaron adam adriaan alain alex alexander alexandra alexis alice alicia amber amelie amy an ana
  andre andrea andreas andy angela angelo ann anna anne annelies anneleen annemie annick anouk
  anthony anton antoine arne arno astrid axel barbara bart bas bastiaan ben benjamin benny bernard
  bert bieke birgit bjorn bram brecht brenda brent britt bruno carine carl carla carmen carlo
  caroline catherine cedric celine charlotte chloe chris christa christel christian christine
  christophe claire claudia cindy clara cor daan dagmar daisy dana daniel danielle danny dave
  david davy debbie deborah delphine dennis diana diane dieter dimitri dirk dominique donna dorien
  dries edith eddy edward eline elise eliza ellen els elke ellie elly emiel emma emmanuel eric erik
  erika ester eva evelien evelyne evi fabian fanny femke filip frank frans frederik freya gary
  geert gerda gert gertjan gilbert gino glenn greet greta gregory griet guido gunter gust guy
  hanna hannah hannelore hans heidi helena helga hendrik henk herman hilde ilse inge ingrid
  ine ines ingrid isabel isabelle ivan jan jana janne jasper jean jeffrey jelle jens jeroen jesse
  jessica jill jo joachim joeri johan johanna johnny jolien jonas joost joris jos jose josefien
  joyce jozef julie julien justine jurgen karel karen karin karolien kasper kathleen kathy katrien
  kelly ken kenneth kevin kim kirsten klaas koen kris kristof kurt lana lara laura lauren laurens
  leen lena leo lien lies liesbeth lieve lindsay lisa lise liselot lore lotte louis luc lucas
  lucie ludo luk lynn maaike maarten manon manu marc marcel marie marieke marijke marina mario
  mark marleen marnix martijn martin martine mathias mathieu matthias maxime melissa michael
  michel michelle michiel mieke miet mieke mike mireille miranda monique nadia nancy natalie
  nathalie nick nicky nico nicolas niels nikki nina noah noor olivier pascal patrick patricia paul
  paulien pedro peggy peter philip philippe pieter pieterjan pim quinten rachel ralf ramon raf
  rebecca reinhilde rembert renaat rene rik rita rob robbe robby robin roel roger ronald ronny
  rosa ruben rudi rudy ruth sabine sabrina sam sandra sandy sanne sara sarah saskia sebastiaan
  seppe sharon shana silke simon simone sofie sonja stefaan stefan steffi stephanie steve steven
  stijn stefanie sven tamara tania tanja ted thibault thijs thomas tibo tim tina tine tineke tom
  tomas toon valerie vanessa veerle vera veronique vic victor vincent wannes ward wendy werner
  wesley wim wout wouter xavier yannick yasmine yentl yves yvonne zoe
`.trim().split(/\s+/));

const normaal = woord => woord.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const isVoornaam = woord => VOORNAMEN.has(normaal(woord));

function zonderNamen(onderwerp) {
  for (const [patroon, vervanging] of VERVANG) {
    if (patroon.test(onderwerp)) return vervanging;
  }
  return onderwerp
    .split(/\s+-\s+/)
    .map(deel => {
      const woorden = deel.split(/\s+/);
      const over = [];
      for (let i = 0; i < woorden.length; i++) {
        if (!isVoornaam(woorden[i])) { over.push(woorden[i]); continue; }
        const volgend = woorden[i + 1];
        if (volgend && STRAAT.test(volgend)) { over.push(woorden[i]); continue; }
        // Voornaam gevonden: ook het volgende woord (achternaam) overslaan, als dat met een hoofdletter begint.
        if (volgend && /^\p{Lu}/u.test(volgend)) i++;
      }
      return over.join(" ");
    })
    .filter(Boolean)
    .join(" - ");
}
