import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

const port = 3000;


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate", async (req, res) => {
  try {
    const { age, level, theme, language } = req.body;

    const prompt = `
Du är en pedagogisk assistent för lärare som undervisar barn i språk.

Skapa en trygg och enkel språkaktivitet för barn baserat på:
- Ålder: ${age}
- Språknivå: ${level}
- Tema: ${theme}

Svara helt på ${language}.
Använd endast ${language} i hela svaret.
Skriv alla rubriker och allt innehåll på ${language}.

Struktur:
1. Aktivitetens namn
2. Kort beskrivning
3. 5 ord eller fraser att träna
4. 3 enkla frågor läraren kan ställa
5. Ett tips till läraren
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    res.json({ result: response.output_text });
  } catch (error) {
    console.error("Serverns fel:", error);
    res.status(500).json({
      error: error?.error?.message || "Något gick fel vid anrop till OpenAI.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server startad på http://localhost:${port}`);
});


app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { category, level, language, amount, difficulty, focus, teacherPrompt } = req.body;

    const normalizedFocus = String(focus || "")
  .trim()
  .toLowerCase();

let focusRules;

if (normalizedFocus === "ordförråd") {
  focusRules = `
========================================
REGLER FÖR ORDFÖRRÅD
========================================

Alla frågor ska endast testa ordförråd.

Det är förbjudet att skapa:
- grammatikfrågor
- stavningsfrågor
- frågor om verbformer
- frågor om artiklar
- frågor om singular eller plural
- luckmeningar där eleven ska välja grammatisk form

Bilden ska vara central i varje fråga.

Frågan ska testa:
- vilket ord bilden föreställer,
- ordets betydelse,
- eller översättning av ordet.

imageKey ska exakt motsvara objektet som frågan handlar om.

Om imageKey = dog ska bilden visa en hund och rätt svar ska handla
om dog eller hund, beroende på valt språk.

Tillåtna exempel:

imageKey = dog

Vilket djur är detta?

dog
cat
rabbit
bear

---

imageKey = bear

Vad betyder björn på engelska?

dog
bear
cat
rabbit

---

imageKey = rabbit

Vilket ord betyder kanin?

rabbit
dog
bear
shark

Förbjudna exempel:

Vilket ord passar? The dog ___ running.

is
are
am
be

---

The ___ is sleeping.

dog
dogs
dogs'
doges

---

___ cat is black.

The
A
An
These

Frågorna ovan testar grammatik och får aldrig förekomma när
språkfokus är ordförråd.

SJÄLVKONTROLL:

Kontrollera före svaret att varje fråga testar ord eller betydelser.

Om någon fråga testar verbform, artikel, pronomen, tempus,
preposition, singular eller plural ska den skrivas om till en
ordförrådsfråga.
`;
} else if (normalizedFocus === "grammatik") {
  focusRules = `
========================================
REGLER FÖR GRAMMATIK
========================================

Alla frågor ska endast testa grammatik.

Det är förbjudet att skapa:
- bildigenkänningsfrågor
- översättningsfrågor
- rena ordförrådsfrågor
- stavningsfrågor
- frågor om vad bilden föreställer

Tillåtna grammatikområden:
- verbformer
- artiklar
- pronomen
- singular och plural
- tempus
- prepositioner
- ordföljd

Varje fråga ska innehålla en tydlig exempelmening.

Kontrollera att grammatikfrågorna varierar.

Om quizet innehåller flera grammatikfrågor får de inte ha samma frågetyp.

Minst tre olika grammatikformat ska användas när fem frågor skapas.

Om två eller fler frågor börjar med exakt samma formulering ska minst en av dem skrivas om.

Använd varierande grammatikfrågor. Vissa typer av frågeställningar får inte domineras i quizet men användas ibland.

Variera frågor mellan dessa:

- Vilket ord passar?
- Vilket pronomen passar?
- Vilken preposition passar?
• Vilken mening är grammatiskt korrekt?
• Vilken mening är rätt skriven?
• Välj den korrekta meningen.
• Vilket alternativ är rätt?
• Vilken mening passar bäst?
• Vilken mening beskriver bilden korrekt?
• Vilket alternativ följer språkregeln?
• Välj den bästa fortsättningen.
• Vilket svar gör meningen korrekt?
• Vilket alternativ fungerar bäst i meningen?
• Vilken mening innehåller rätt verbform?
• Vilken mening använder rätt pronomen?
• Vilken mening använder rätt tempus?
• Vilken mening använder rätt ordföljd?
• Vilken mening använder rätt artikel?
• Vilken mening använder rätt preposition?
• Vilket alternativ följer engelsk grammatik?
• Hitta den grammatiskt korrekta meningen.

Skapa inte flera frågor som testar samma grammatikregel.

Om quizet innehåller fem frågor ska minst fyra olika grammatikområden användas.



Undvik att flera frågor testar samma regel, exempelvis flera olika "is/are"-frågor.

Det ska finnas en tydlig och märkbar skillnad mellan svårighetsgraderna lätt, medel och utmanande inom varje årskurs.

Exempel:

Årskurs 4:
- Lätt: grundläggande frågor med enkla meningar och en grammatisk regel åt gången.
- Medel: längre meningar, mer sammanhang och mer trovärdiga felalternativ.
- Utmanande: flera grammatiska regler eller mer komplexa meningar som kräver analys.

Årskurs 5:
- Lätt: grundläggande nivå för årskurs 5.
- Medel: normal nivå för årskurs 5 med större krav på språkförståelse.
- Utmanande: avancerade frågor för årskurs 5 med komplexare grammatik, längre meningar och fler trovärdiga svarsalternativ.

Årskurs 6:
- Lätt: grundläggande nivå för årskurs 6 men fortfarande tydligt svårare än lätt för årskurs 5.
- Medel: normal nivå för årskurs 6 med varierade grammatiska strukturer.
- Utmanande: de mest avancerade frågorna som är rimliga för årskurs 6 och som kräver analys av hela meningar och grammatiska samband.

Svårighetsgraden ska påverka:
- meningarnas längd,
- grammatikens komplexitet,
- hur mycket eleven behöver analysera,
- hur lika svarsalternativen är,
- och hur mycket sammanhang som krävs för att hitta rätt svar.

Skillnaden mellan lätt, medel och utmanande ska vara tydlig inom samma årskurs.

En fråga som skapats för "lätt" får inte kunna användas som "medel" eller "utmanande" utan att först göras märkbart svårare.

På samma sätt får en fråga som skapats för "utmanande" inte kunna användas som "lätt" utan att först förenklas tydligt.

När språkfokus är grammatik ska svårighetsgraden även påverka vilka grammatiska områden som används.

Använd följande exempel som vägledning för hur svårighetsgraderna ska skilja sig åt.

Kopiera aldrig exemplen ordagrant.

Skapa alltid nya frågor som följer samma nivå och progression.

========================================
ÅRSKURS 4 – LÄTT
========================================

Lätt för årskurs 4 ska innehålla:

- mycket korta meningar
- en grammatisk regel per fråga
- enkla svarsalternativ
- inga grammatiska begrepp i frågetexten

Exempel på frågetyper:

• Vilket alternativ passar bäst?
• Vad passar i meningen?
• Vilken mening är rätt?

Exempel på grammatik:

- is / are / am
- can
- has / have
- singular och plural
- a / an / the
- vanliga prepositioner

========================================
ÅRSKURS 4 – MEDEL
========================================

Medel för årskurs 4 ska vara tydligt svårare än lätt.

Skillnaden ska märkas genom:

- längre meningar
- mer naturligt språk
- större krav på sammanhang
- mer trovärdiga felalternativ

Exempel på frågetyper:

• Vilken mening är grammatiskt korrekt?
• Vilket alternativ gör meningen korrekt?
• Vilket alternativ passar bäst?

Exempel på grammatik:

- verbformer
- was / were
- hjälpverb
- plural
- ordföljd
- pronomen

========================================
ÅRSKURS 4 – UTMANANDE
========================================

Utmanande för årskurs 4 ska vara tydligt svårare än medel.

Skillnaden ska märkas genom:

- längre meningar
- mer analys
- mer komplex grammatik
- mycket trovärdiga felalternativ

Exempel på grammatik:

- verbformer
- tempus
- ordföljd
- modala hjälpverb
- prepositioner där flera alternativ känns rimliga

Grammatiska begrepp får användas i frågetexten.

========================================
ÅRSKURS 5
========================================

Årskurs 5 ska vara ett tydligt steg svårare än årskurs 4.

Lätt:
- längre meningar än årskurs 4
- fortfarande en grammatisk regel per fråga

Medel:
- större krav på sammanhang
- pronomen
- perfektformer
- ordföljd
- hjälpverb

Utmanande:
- längre meningar
- flera grammatiska regler
- tempus
- modala hjälpverb
- ordföljd
- prepositioner i sammanhang

========================================
ÅRSKURS 6
========================================

Årskurs 6 ska vara ett tydligt steg svårare än årskurs 5.

Lätt:
- naturliga meningar
- grundläggande grammatik för årskurs 6
- längre meningar än årskurs 5

Medel:
- större fokus på sammanhang
- tempus
- pronomen
- längre meningar
- flera rimliga svarsalternativ

Utmanande:
- de mest avancerade frågorna som är rimliga för årskurs 6
- längre och mer naturliga meningar
- flera grammatiska regler i samma mening
- analys av hela meningen
- mycket trovärdiga felalternativ

========================================
VARIATION I VARJE QUIZ
========================================

Alla grammatikfrågor i samma quiz ska vara varierade.

Använd inte samma frågetyp flera gånger i rad.

Om quizet innehåller fem frågor ska minst fyra olika frågeformuleringar användas.

Variera exempelvis mellan:

- Vilket alternativ passar bäst?
- Vad passar i meningen?
- Vilken mening är rätt?
- Vilken mening är grammatiskt korrekt?
- Vilken verbform är korrekt?
- Vilken preposition passar bäst?
- Vilket pronomen passar bäst?
- Vilken mening har rätt ordföljd?
- Vilket alternativ gör meningen korrekt?
- Vilken mening använder rätt tempus?

Variera även grammatikområdena.

Om fem frågor skapas ska minst fyra olika grammatikområden användas.

Skapa aldrig flera frågor som testar exakt samma grammatiska regel.

Frågorna ska kännas som fem olika typer av grammatikuppgifter och inte som samma fråga med olika ord.

Använd exemplen ovan endast som vägledning för nivå och progression.

Kopiera aldrig exemplen ordagrant.

Skapa alltid nya, varierade frågor.

Svarsalternativen ska vara mycket trovärdiga.

Eleven ska behöva analysera hela meningen innan rätt svar kan väljas.

Undvik att använda enkla "is/are"- eller "has/have"-frågor som huvuddelen av ett utmanande quiz.

När språk = engelska:
- Instruktionen får vara på svenska eller engelska.
- Exempelmeningen ska vara på engelska.
- Svarsalternativen ska vara på engelska.

KOPPLING TILL IMAGEKEY:

imageKey ska motsvara substantivet som används i exempelmeningen.

Om imageKey = dog ska exempelmeningen handla om en hund.


Bilden och exempelmeningen handlar då om olika objekt.

Frågan får inte testa vilket substantiv bilden föreställer.
Det som testas ska vara den grammatiska strukturen.

SJÄLVKONTROLL:

Kontrollera att:
- varje fråga testar grammatik,
- imageKey matchar substantivet i meningen,
- ingen fråga testar bildigenkänning eller översättning.
`;
} else if (normalizedFocus === "stavning") {
  focusRules = `
========================================
REGLER FÖR STAVNING
========================================

Alla frågor ska endast testa stavning.

Det är förbjudet att skapa:
- grammatikfrågor
- översättningsfrågor
- bildigenkänningsfrågor
- frågor om ordets betydelse

Varje fråga ska be eleven välja det korrekt stavade ordet.

När språk = engelska ska svarsalternativen vara på engelska.
När språk = spanska ska svarsalternativen vara på spanska.

imageKey ska motsvara ordet som testas.

Rätt:

imageKey = dog

Vilket ord är rättstavat?

dog
doog
dgo
dogg

Fel:

imageKey = dog

Vilket ord är rättstavat?

hand
haand
hnd
handd

Bilden och ordet som testas handlar då om olika objekt.

SJÄLVKONTROLL:

Kontrollera att varje fråga endast testar stavning och att
imageKey motsvarar ordet som testas.
`;
} else {
  throw new Error(`Okänt språkfokus: ${focus}`);
}

const normalizedDifficulty = String(difficulty || "")
  .trim()
  .toLowerCase();

const gradeMatch = String(level || "").match(/[2-6]/);
const grade = gradeMatch ? Number(gradeMatch[0]) : null;

if (!grade) {
  throw new Error(`Ogiltig årskurs: ${level}`);
}

if (normalizedDifficulty === "svår") {
  normalizedDifficulty = "utmanande";
}

const allowedDifficulties = ["lätt", "medel", "utmanande"];

if (!allowedDifficulties.includes(normalizedDifficulty)) {
  throw new Error(`Ogiltig svårighetsgrad: ${difficulty}`);
}

/*
  Kontrollerar att språkfokus är tillåtet för vald årskurs.

  Årskurs 2:
  - endast ordförråd

  Årskurs 3:
  - ordförråd och stavning

  Årskurs 4–6:
  - ordförråd och grammatik
*/

const allowedFocusByGrade = {
  2: ["ordförråd"],
  3: ["ordförråd", "stavning"],
  4: ["ordförråd", "grammatik", "stavning"],
  5: ["ordförråd", "grammatik", "stavning"],
  6: ["ordförråd", "grammatik", "stavning"]
};

if (!allowedFocusByGrade[grade].includes(normalizedFocus)) {
  throw new Error(
    `Språkfokus "${normalizedFocus}" är inte tillåtet för årskurs ${grade}.`
  );
}

let difficultyRules;

if (normalizedDifficulty === "lätt") {
  difficultyRules = `
========================================
SVÅRIGHETSGRAD: LÄTT
========================================

Svårighetsgraden ska vara lätt I FÖRHÅLLANDE TILL årskurs ${grade}.

"Lätt" betyder inte samma kunskapsnivå för alla årskurser.

En lätt fråga för årskurs 6 ska:
- vara anpassad till elever i årskurs 6,
- vara tydligt mer avancerad än en lätt fråga för årskurs 2,
- men vara enklare än medel och utmanande för årskurs 6.

${grade === 2 ? `
REGLER FÖR ÅRSKURS 2 + LÄTT:

- Använd mycket vanliga och konkreta ord.
- Använd mycket korta svenska instruktioner.
- Testa endast ett ord åt gången.
- Bilden ska ge tydligt stöd.
- Felalternativen ska vara tydligt olika från rätt svar.
- Eleven ska främst känna igen ordet eller bilden.
` : ""}

${grade === 3 ? `
REGLER FÖR ÅRSKURS 3 + LÄTT:

- Använd vanliga och konkreta ord.
- Använd korta och tydliga instruktioner.
- Testa endast en sak åt gången.
- Vid ordförråd ska eleven känna igen ord eller betydelse.
- Vid stavning ska felstavningarna vara tydligt olika från rätt stavning.
- Felalternativen får inte vara för lika varandra.
` : ""}

${grade === 4 ? `
REGLER FÖR ÅRSKURS 4 + LÄTT:

- Frågan ska fortfarande motsvara en rimlig nivå för årskurs 4.
- Använd enkla, fullständiga meningar.
- Använd vanliga ord och vanliga grammatiska strukturer.
- Testa endast en tydlig regel eller betydelse åt gången.
- Felalternativen ska vara rimliga men relativt lätta att skilja åt.
- Undvik frågor som endast passar årskurs 2 eller 3.
` : ""}

${grade === 5 ? `
REGLER FÖR ÅRSKURS 5 + LÄTT:

- Frågan ska motsvara grundläggande kunskaper för årskurs 5.
- Använd fullständiga och naturliga meningar.
- Frågan får kräva enkel förståelse av sammanhanget.
- Felalternativen ska vara trovärdiga men inte mycket lika.
- Undvik rena igenkänningsfrågor som är för enkla för årskurs 5.
- Vid ordförråd bör ordet helst förekomma i ett enkelt sammanhang.
` : ""}

${grade === 6 ? `
REGLER FÖR ÅRSKURS 6 + LÄTT:

- Frågan ska fortfarande motsvara grundläggande kunskaper för årskurs 6.
- Använd fullständiga och naturliga meningar.
- Eleven ska behöva förstå frågans sammanhang.
- Undvik rena frågor som endast testar mycket grundläggande igenkänning.
- Undvik enbart frågor som "Vad betyder dog?".
- Vid ordförråd ska ordet användas i en enkel mening eller ett tydligt sammanhang.
- Vid grammatik ska en vanlig grammatisk struktur testas.
- Felalternativen ska vara trovärdiga men inte alltför lika.
` : ""}
`;
} else if (normalizedDifficulty === "medel") {
  difficultyRules = `
========================================
SVÅRIGHETSGRAD: MEDEL
========================================

Svårighetsgraden ska motsvara normal förväntad nivå för årskurs ${grade}.

"Medel" betyder:
- normal nivå för den valda årskursen,
- svårare än lätt inom samma årskurs,
- men enklare än utmanande inom samma årskurs.

${grade === 2 ? `
REGLER FÖR ÅRSKURS 2 + MEDEL:

- Använd vanliga och konkreta ord.
- Använd korta svenska instruktioner.
- Bilden ska fortfarande vara central.
- Felalternativen ska vara rimliga och något mer lika varandra.
- Eleven ska behöva tänka efter, inte bara välja det mest uppenbara alternativet.
` : ""}

${grade === 3 ? `
REGLER FÖR ÅRSKURS 3 + MEDEL:

- Använd korta men fullständiga frågor.
- Frågan ska kräva viss förståelse, inte endast igenkänning.
- Vid ordförråd får betydelsen testas från svenska till målspråket.
- Vid stavning ska felstavningarna likna rätt stavning.
- Felalternativen ska representera rimliga misstag.
` : ""}

${grade === 4 ? `
REGLER FÖR ÅRSKURS 4 + MEDEL:

- Använd fullständiga meningar.
- Frågan ska motsvara normal nivå för årskurs 4.
- Eleven ska behöva använda meningens sammanhang.
- Felalternativen ska vara trovärdiga och relativt lika.
- Vid grammatik ska en relevant grammatisk regel testas.
- Vid ordförråd bör ordet användas i eller kopplas till en kort mening.
` : ""}

${grade === 5 ? `
REGLER FÖR ÅRSKURS 5 + MEDEL:

- Använd något mer utvecklade meningar.
- Frågan ska kräva förståelse och inte endast igenkänning.
- Felalternativen ska representera vanliga språkliga misstag.
- Vid grammatik ska rätt form avgöras genom sammanhanget.
- Vid ordförråd ska betydelsen helst avgöras genom en kort mening.
` : ""}

${grade === 6 ? `
REGLER FÖR ÅRSKURS 6 + MEDEL:

- Frågan ska motsvara normal förväntad nivå för årskurs 6.
- Använd utvecklade men tydliga meningar.
- Eleven ska behöva analysera meningen eller sammanhanget.
- Undvik enkla direktöversättningar av mycket grundläggande ord.
- Vid ordförråd ska ordets funktion eller betydelse testas i ett sammanhang.
- Vid grammatik får tempus, pronomen, prepositioner,
  verbformer eller ordföljd testas.
- Felalternativen ska vara trovärdiga och relativt lika.
` : ""}
`;
} else if (normalizedDifficulty === "utmanande") {
  difficultyRules = `
========================================
SVÅRIGHETSGRAD: UTMANANDE
========================================

Svårighetsgraden ska vara utmanande I FÖRHÅLLANDE TILL årskurs ${grade}.

Frågorna ska vara mer krävande än normal nivå för den valda årskursen,
men fortfarande vara möjliga, tydliga och pedagogiskt lämpliga.

En utmanande fråga får aldrig automatiskt bli en fråga för äldre elever.

${grade === 2 ? `
REGLER FÖR ÅRSKURS 2 + UTMANANDE:

- Använd fortfarande mycket korta och barnvänliga instruktioner.
- Använd endast vanliga konkreta ord.
- Gör felalternativen mer lika varandra.
- Frågan får kräva att eleven skiljer mellan flera rimliga alternativ.
- Bilden ska fortfarande ge stöd.
- Använd inte grammatik eller stavning.
` : ""}

${grade === 3 ? `
REGLER FÖR ÅRSKURS 3 + UTMANANDE:

- Använd korta men något mer krävande frågor.
- Vid ordförråd ska felalternativen vara mer lika eller semantiskt närliggande.
- Vid stavning ska felstavningarna ligga nära rätt stavning.
- Frågan får kräva förståelse av en kort mening.
- Använd inte grammatik.
- Innehållet får inte bli anpassat för årskurs 5 eller 6.
` : ""}

${grade === 4 ? `
REGLER FÖR ÅRSKURS 4 + UTMANANDE:

- Använd längre men tydliga meningar.
- Eleven ska behöva analysera sammanhanget.
- Felalternativen ska vara språkligt trovärdiga.
- Vid ordförråd ska ordets betydelse testas i en mening.
- Vid grammatik ska rätt form avgöras genom subjektet eller sammanhanget.
- Frågan får inte bli orimligt avancerad för årskurs 4.
` : ""}

${grade === 5 ? `
REGLER FÖR ÅRSKURS 5 + UTMANANDE:

- Använd mer utvecklade men tydliga meningar.
- Eleven ska behöva använda både regelkunskap och sammanhang.
- Felalternativen ska representera vanliga och trovärdiga misstag.
- Vid ordförråd ska betydelsen avgöras utifrån sammanhanget.
- Vid grammatik får tempus, pronomen, ordföljd och prepositioner testas.
- Frågan ska vara utmanande men fortfarande passa årskurs 5.
` : ""}

${grade === 6 ? `
REGLER FÖR ÅRSKURS 6 + UTMANANDE:

- Använd mer komplexa men fortfarande tydliga meningar.
- Eleven ska behöva analysera hela meningen innan svaret väljs.
- Undvik rena översättningsfrågor med mycket grundläggande ord.
- Vid ordförråd ska ordets betydelse eller användning avgöras genom sammanhanget.
- Vid grammatik får tempus, verbkongruens, pronomen,
  prepositioner och ordföljd testas.
- Felalternativen ska vara mycket trovärdiga.
- Felalternativen ska representera vanliga språkliga misstag.
- Frågan får inte bli anpassad för gymnasie- eller vuxennivå.
` : ""}

========================================
VARIATION MELLAN SVÅRIGHETSGRADER
========================================

Lätt:
- Fokusera på en grammatisk regel åt gången.
- Använd korta meningar.
- Felalternativen ska vara tydligt olika.

Medel:
- Variera mellan flera grammatikområden.
- Använd både luckmeningar och frågor med hela meningar.
- Felalternativen ska vara mer lika varandra.
- Eleven ska behöva förstå meningens sammanhang.

Utmanande:
- Använd flera olika grammatiktyper.
- Prioritera frågor där eleven analyserar en hel mening.
- Använd så lite som möjligt enkla "is / are / am"-frågor.
- Använd ordföljd, tempus, pronomen, prepositioner, artiklar och meningsstruktur.
- Felalternativen ska vara mycket trovärdiga.
- Eleven ska behöva analysera hela meningen innan svaret kan väljas.

`;
}

const prompt = `
Du ska skapa ett språkquiz för barn.

========================================
VALDA INSTÄLLNINGAR
========================================

Kategori: ${category}
Årskurs: ${grade}
Svårighetsgrad: ${normalizedDifficulty}
Målspråk: ${language}
Språkfokus: ${normalizedFocus}
Antal frågor: ${amount}

Lärarens önskemål:
${teacherPrompt || "Inga särskilda önskemål."}

Lärarens önskemål får aldrig åsidosätta reglerna för:
- valt språkfokus,
- valt språk,
- vald kategori,
- årskurs,
- imageKey,
- feedback,
- eller JSON-formatet.

========================================
ORDLISTOR
========================================

Varje fråga ska använda ett objekt från den valda kategorin.

DJUR:
dog = hund = perro
cat = katt = gato
rabbit = kanin = conejo
penguin = pingvin = pingüino
bear = björn = oso
shark = haj = tiburón

MAT:
apple = äpple = manzana
banana = banan = plátano
carrot = morot = zanahoria
cheese = ost = queso
hamburger = hamburgare = hamburguesa
pasta = pasta = pasta
pizza = pizza = pizza

KROPPEN:
ear = öra = oreja
eye = öga = ojo
foot = fot = pie
hand = hand = mano
mouth = mun = boca
nose = näsa = nariz

Endast objekt från den valda kategorin får användas som:
- huvudord i frågan,
- rätt svar vid ordförråd,
- ordet som testas vid stavning,
- substantiv i exempelmeningen vid grammatik,
- och imageKey.

Ord från andra kategorier får inte användas.

imageKey ska alltid anges med det engelska grundordet från ordlistan,
även när målspråket är svenska eller spanska.

Exempel:
- hund, dog eller perro → imageKey ska vara "dog"
- hand, hand eller mano → imageKey ska vara "hand"
- äpple, apple eller manzana → imageKey ska vara "apple"

Vid grammatik får vanliga grammatiska hjälpord användas även om de
inte finns i ordlistan, exempelvis:

is, are, am, has, have, a, an, the, in, on, under,
he, she, it, they, this, these.

Vanliga verb får också användas för att skapa naturliga
exempelmeningar, exempelvis:

running, eating, sleeping, jumping, swimming.

Dessa hjälpord och verb får aldrig användas som imageKey.

========================================
ABSOLUTA KRAV FÖR VARJE FRÅGA
========================================

Varje fråga måste innehålla exakt dessa fält:

- question
- answers
- correctAnswer
- imageKey
- feedback

Varje fråga ska ha exakt fyra unika svarsalternativ.

Exakt ett svarsalternativ ska vara korrekt.

correctAnswer måste vara exakt identiskt med ett av alternativen
i answers, inklusive stavning och stora eller små bokstäver.

imageKey måste:
- vara ett engelskt grundord från vald kategori,
- motsvara objektet som frågan handlar om,
- och ge rätt bild till frågan.

Skapa exakt ${amount} frågor.

Skapa inte fler eller färre frågor.

Frågetexten får inte innehålla:
- kommentarer inom parentes,
- information om vilken bild som visas,
- rätt svar,
- eller en förklaring av frågan.

Fel:
"Vilket djur är detta? (Bilden visar en hund)"

Rätt:
"Vilket djur är detta?"

========================================
REGLER FÖR VALT SPRÅKFOKUS
========================================

${focusRules}

========================================
REGLER FÖR VALD SVÅRIGHETSGRAD
========================================

${difficultyRules}

========================================
SPRÅKREGLER
========================================

Om målspråk = engelska:

- Spanska får aldrig förekomma.
- Svarsalternativ som testar målspråket ska vara på engelska.
- Svenska får användas i instruktionen när årskursreglerna kräver det.
- En fråga får innehålla en svensk instruktion följd av en engelsk
  exempelmening endast när språkfokus är grammatik.
- Blanda aldrig svenska och engelska inne i samma mening.

Tillåtet vid grammatik:

"Vilket ord passar? The dog ___ running."

Här är "Vilket ord passar?" instruktionen och
"The dog ___ running." den engelska exempelmeningen.

Inte tillåtet:

"What betyder dog?"

"Choose rätt word."

Om målspråk = spanska:

- Engelska får aldrig förekomma i question, answers eller correctAnswer.
- imageKey ska fortfarande vara det engelska tekniska nyckelordet,
  eftersom det används internt för att välja bild.
- Svenska får användas i instruktioner och översättningsfrågor.
- Svarsalternativ som testar målspråket ska vara på spanska.
- Vid grammatik ska exempelmeningen vara på spanska.
- Blanda aldrig svenska och spanska inne i samma mening.

Exempel vid grammatik:

"Vilket ord passar? El perro ___ grande."

Exempel vid ordförråd:

"Vilket ord betyder hund?"

Svar:
perro
gato
oso
conejo

Om målspråk = svenska:

- Frågor, svarsalternativ och correctAnswer ska vara på svenska.
- imageKey ska fortfarande vara det engelska tekniska nyckelordet.
- Engelska och spanska får inte förekomma i question, answers
  eller correctAnswer.

========================================
ÅRSKURSREGLER
========================================

Årskurs 2:

- Instruktionen ska alltid vara på svenska.
- Använd mycket korta och tydliga instruktioner.
- Använd vanliga ord.
- Undvik långa meningar.
- Vid ordförråd ska bilden vara central.
- Vid stavning ska bilden visa ordet som testas.
- Vid grammatik får en svensk instruktion följas av en kort
  exempelmening på målspråket.
- Feedback får innehålla högst 5 ord.

Exempel på tillåten grammatikfråga i engelska:

"Vilket ord passar? The dog ___ running."

Detta är tillåtet eftersom instruktionen är på svenska och
exempelmeningen tränar engelska.

Årskurs 3:

- Använd korta och tydliga frågor.
- Frågetexten bör innehålla högst 8 ord när det är möjligt.
- Svenska instruktioner får blandas med målspråkets
  exempelmeningar.
- Feedback får innehålla högst 8 ord.

Årskurs 4:

- Använd enkla hela meningar.
- Frågetexten bör innehålla högst 10 ord när det är möjligt.
- Feedback får innehålla högst 12 ord.

Årskurs 5:

- Något längre frågor och meningar får användas.
- Frågorna ska fortfarande vara tydliga för barn.
- Feedback får innehålla högst 18 ord.

Årskurs 6:

- Mer utvecklade meningar får användas.
- Frågorna får ställa något högre krav på språkförståelse.
- Feedback får innehålla högst 25 ord.

Svårighetsgraden ska alltid tolkas relativt till den valda årskursen.

Reglerna i avsnittet "REGLER FÖR VALD SVÅRIGHETSGRAD"
har företräde framför generella antaganden om vad lätt,
medel eller utmanande betyder.

Svårighetsgraden får aldrig ändra språkfokus.

Den får aldrig ändra språkfokus.

Exempel:

- Lätt ordförråd ska fortfarande vara ordförråd.
- Svårt ordförråd får inte bli grammatik.
- Lätt grammatik ska fortfarande vara grammatik.
- Svår stavning får inte bli ordförråd.

Om målspråk = spanska och svårighetsgrad = lätt:

- Instruktionen ska vara på svenska.
- Svarsalternativen ska vara på spanska.
- Vid grammatik får den spanska exempelmeningen förekomma efter
  den svenska instruktionen.

========================================
FEEDBACK
========================================

Feedback ska alltid vara helt på svenska, oavsett målspråk.

Feedback ska:
- vara kort,
- vara pedagogisk,
- förklara den relevanta språkprincipen,
- vara anpassad till vald årskurs,
- och följa årskursens ordgräns.

Feedback får aldrig:
- upprepa correctAnswer,
- avslöja det rätta svaret,
- innehålla engelska eller spanska,
- innehålla "Rätt svar är",
- innehålla "Svaret är",
- innehålla "Bra jobbat",
- innehålla "Snyggt",
- innehålla "Rätt svar",
- eller innehålla "Nästan".

Vid ordförråd ska feedback kort förklara ordets betydelse
utan att skriva det korrekta svarsalternativet.

Vid grammatik ska feedback förklara den grammatiska principen
utan att upprepa det korrekta svaret.

Vid stavning ska feedback förklara något enkelt om stavningen
utan att skriva det korrekt stavade ordet.

========================================
SLUTKONTROLL
========================================

Kontrollera varje fråga innan JSON returneras.

Kontrollera att:

1. Frågan följer exakt det valda språkfokuset:
   "${normalizedFocus}".

2. Frågan inte tillhör någon annan frågetyp.

3. Objektet tillhör kategorin:
   "${category}".

4. imageKey motsvarar objektet i frågan.

5. Vid ordförråd:
   - frågan testar ord, betydelse eller översättning,
   - bilden är relevant,
   - och ingen grammatik eller stavning testas.

6. Vid grammatik:
   - frågan innehåller en tydlig exempelmening,
   - imageKey motsvarar substantivet i exempelmeningen,
   - bilden och meningen handlar om samma objekt,
   - och det som testas är en grammatisk struktur.

7. Vid stavning:
   - imageKey motsvarar ordet som testas,
   - exakt ett alternativ är korrekt stavat,
   - och ingen grammatik, betydelse eller översättning testas.

8. question följer språk- och årskursreglerna.

9. answers innehåller exakt fyra unika alternativ.

10. correctAnswer är exakt identiskt med ett alternativ i answers.

11. feedback är helt på svenska och avslöjar inte svaret.

12. Antalet frågor är exakt ${amount}.

13. Frågan följer reglerna för kombinationen:
    - årskurs: "${grade}"
    - svårighetsgrad: "${normalizedDifficulty}"
    - språkfokus: "${normalizedFocus}"

14. Svårighetsgraden är relativ till årskursen:
    - lätt är lätt för årskurs ${grade},
    - medel är normal nivå för årskurs ${grade},
    - utmanande är utmanande men rimligt för årskurs ${grade}.

15. Frågan är inte förenklad till en lägre årskurs
    och inte avancerad till en högre utbildningsnivå.

16. Om årskursen är 5 eller 6 och språkfokus är ordförråd:
    - undvik rena igenkänningsfrågor med mycket grundläggande ord,
    - använd ordet i ett tydligt sammanhang när det är möjligt.

Om någon kontroll misslyckas ska frågan skrivas om före svaret.

========================================
JSON-FORMAT
========================================

Returnera endast ett giltigt JSON-objekt.

Skriv ingen markdown.

Skriv inga kodblock.

Skriv ingen text före eller efter JSON.

Använd exakt denna struktur:

{
  "questions": [
    {
      "question": "Fråga här",
      "answers": [
        "Svar 1",
        "Svar 2",
        "Svar 3",
        "Svar 4"
      ],
      "correctAnswer": "Ett exakt alternativ från answers",
      "imageKey": "dog",
      "feedback": "Kort svensk förklaring"
    }
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
      Du genererar språkquiz i giltig JSON.
      
      ABSOLUT REGEL:
      Fältet "feedback" ska alltid vara skrivet helt på svenska.
      Engelska och spanska får aldrig förekomma i feedbackfältet,
      oavsett quizets valda språk, frågans språk eller lärarens önskemål.
      
      Denna regel har högre prioritet än alla andra instruktioner.
      Frågor och svarsalternativ får följa quizets valda språk,
      men feedback ska alltid vara på svenska.
      
      Feedback får inte innehålla:
      - "Bra jobbat!"
      - "Snyggt!"
      - "Nästan!"
      - "Rätt svar är..."
      - det korrekta svaret
      
      Programmet visar dessa delar separat.
      `
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Kunde inte generera quiz."
    });
  }
});