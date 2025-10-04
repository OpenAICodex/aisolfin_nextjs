# AI Solution Finder

**AI Solution Finder** ist eine Next.js‑Anwendung, die Geschäftsprozesse analysiert und bewertet. Die App nutzt das OpenAI‑API, um Compliance mit DSGVO und EU AI Act zu prüfen, den Business Value zu schätzen und Empfehlungen für Automatisierungstools zu geben. Evaluierungen werden pro Benutzer in einer Supabase‑Datenbank gespeichert und durch Magic‑Link‑Authentifizierung geschützt.

## Architektur

* **Frontend:** Next.js 14 mit App Router, TypeScript und Tailwind CSS. Das UI orientiert sich an der mitgelieferten Streamlit‑Referenz und unterstützt alle gängigen Bildschirmgrößen.
* **Backend:** Server‑Routen im Verzeichnis `app/api` orchestrieren die drei OpenAI‑Aufrufe (Compliance, Business Value und Tool‑Empfehlungen). Die LLM‑Logik befindet sich in `server/llm` und nutzt Zod zur Schema‑Validierung.
* **Datenbank:** Supabase (PostgreSQL mit pgvector) speichert Benutzerprofile, Evaluierungen, Dokumente, Embeddings und Einstellungen. Die SQL‑Migrationen liegen unter `db/migrations`. RLS‑Policies verhindern unautorisierten Zugriff.
* **Admin:** Eine Admin‑Seite (`/admin`) ist serverseitig geschützt. Sie dient als Platzhalter für Funktionen wie Prompt‑Bearbeitung, PDF‑Upload und Re‑Embedding.

## Einrichtung

1. **Repository installieren**

   ```bash
   npm install
   ```

2. **Supabase einrichten**

   * Erstelle ein neues [Supabase‑Projekt](https://supabase.com). Aktiviere die `vector`‑Erweiterung und erstelle die Datenbanktabellen über die SQL‑Datei `db/migrations/0001_init.sql`.
   * Hinterlege in den Umgebungsvariablen die Werte für `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY`.

3. **OpenAI konfigurieren**

   * Lege einen API‑Key in `OPENAI_API_KEY` fest. Du kannst `OPENAI_CHAT_MODEL` und `OPENAI_EMBEDDING_MODEL` bei Bedarf anpassen.

4. **Entwicklung starten**

   ```bash
   npm run dev
   ```
   Die Anwendung ist anschließend unter `http://localhost:3000` erreichbar. Nicht‑authentifizierte Besucher werden automatisch zur Anmeldeseite umgeleitet.

## Scripts

* **Embedding neuer Dokumente:** Mit `ts-node scripts/embed.ts <pdf>` können Administratoren neue PDF‑Regulationen einlesen, in Chunks aufteilen, Vektoren berechnen und in die Datenbank schreiben. Vor dem Ausführen müssen sowohl OpenAI‑ als auch Supabase‑Credentials als Umgebungsvariablen gesetzt sein.

## Tests & CI

Dieses Repository enthält eine Grundstruktur für Tests (Vitest) und Pixel‑Vergleiche (Playwright) sowie Linting und Typprüfung. Die konkreten Testfälle und GitHub‑Workflows müssen noch ergänzt werden, um die in der Aufgabenstellung definierten Qualitätsziele (≥ 99 % Pixel‑Ähnlichkeit bei 1920 px) zu erfüllen.

## Sicherheitshinweise

* **Secrets bleiben serverseitig.** API‑Keys und Service‑Keys dürfen niemals im Browser ausgeliefert werden.
* **RLS aktivieren.** Die beigefügten SQL‑Policies sorgen dafür, dass Benutzer nur ihre eigenen Daten sehen. Admin‑Rollen werden über die Tabelle `profiles.role` gesteuert.
* **Daily Cap:** Nicht‑Admin‑Benutzer können maximal drei Evaluierungen pro Tag durchführen (Europe/Berlin). Weitere Anfragen liefern den HTTP‑Status 429.

## Weiterentwicklung

Um das System produktiv zu nutzen, müssen folgende Punkte umgesetzt werden:

1. **Admin‑Interface:** Vollständige Implementierung zum Bearbeiten von Prompts und Hochladen von PDF‑Dokumenten. Nach dem Upload müssen Vektoren re‑embeddet und alte Vektoren archiviert werden.
2. **Kontaktformular:** Bei Erreichen des Tageslimits soll ein Kontaktformular erscheinen, das eine E‑Mail via Nodemailer verschickt und einen DB‑Eintrag anlegt.
3. **Pixel‑Perfect Design:** Die Tailwind‑Themenwerte in `tailwind.config.ts` dienen als Ausgangspunkt. Für eine exakte Übereinstimmung mit der Referenz müssen Farben, Abstände und Schriften ggf. angepasst und eine CI‑basierte Pixel‑Diff‑Prüfung eingerichtet werden.

Bei Fragen oder zur Fehlersuche siehe die Kommentare im Quellcode und die Aufgabenbeschreibung in der Wurzel des Projekts.