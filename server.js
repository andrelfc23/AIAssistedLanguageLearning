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