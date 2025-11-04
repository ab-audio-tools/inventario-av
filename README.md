# Inventario

## Stack
- **Next.js** + **React** + **TypeScript**
- **Prisma** (DB di sviluppo SQLite; compatibile con Postgres/MySQL in produzione)
- **Tailwind CSS**
- Tooling: ESLint, PostCSS
- Script utili: Prisma Studio, seed

---

## 🧰 Prerequisiti

Assicurati di avere installato:

- [Node.js ≥ 18.17](https://nodejs.org/)
- [npm ≥ 9](https://www.npmjs.com/)
- (Facoltativo) [Git](https://git-scm.com/) per clonare il repository

Verifica la versione:
```bash
node -v
npm -v
```
---
## Setup MacOS

### 1) Clona e installa
```bash
git clone https://github.com/ab-audio-tools/inventario-av.git
cd inventario-av
npm ci   # oppure: npm install
```
### 2) Variabili d'ambiente

```bash
cp .env.example .env
```
### 3) Database & Prisma
Genera client e crea/tieni allineato lo schema:

```bash
npx prisma generate --schema=prisma/schema.prisma
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init --schema=prisma/schema.prisma
npm run seed
```

### 4) Avvia 

```bash
npm run dev
```
Mantieni aperto il terminale e visita [https://localhost:3000](https://localhost:3000)
Per gestire il database, in un nuovo terminale usa:
```bash
npx prisma studio
```
e visita il link che stampa (di solito localhost:5555 o di solito localhost:5556)

---
## Setup Windows

### 1) Clona e installa
```powershell
git clone <REPO_URL>
Set-Location inventario-av
npm ci   # oppure: npm install
```
### 2) Variabili d'ambiente

```powershell
Copy-Item .env.example .env
```
### 3) Database & Prisma
Genera client e crea/tieni allineato lo schema:

```powershell
npx prisma generate --schema=prisma/schema.prisma
$env:DATABASE_URL="file:./dev.db"; npx prisma migrate dev --name init --schema=prisma/schema.prisma
npm run seed
```

### 4) Avvia 

```powershell
npm run dev
```
Mantieni aperto il terminale e visita [https://localhost:3000](https://localhost:3000)
Per gestire il database, in un nuovo terminale usa:
```powershell
npx prisma studio
```
e visita il link che stampa (di solito localhost:5555 o di solito localhost:5556)

---
### Utenti prova

```
admin:admin123
tech:tech123
user:user123
office:office123
guest:guest123
```
---

### Roadmap

1) [x] Definire user case:
    - "admin" può fare tutto
    - "tech" può fare tutto tranne gestire utenti e check-in
    - "user" può semplicemente creare un movimento e vedere lo storico dei suoi movimenti
    - "uffici" stessi permessi di user + funzione di solo export
    - "guest" può solo vedere la home, senza possibilità di avere accesso al carrello e/o fare movimenti e/o scegliere quantità
  
2) [x] Aggiungere orario nel production manager checkout e relative modifiche nel DB
3) [x] Aggiungere ricevuta pdf dopo il check-in per ogni operazione di check-in (completa o incompleta)
4) [x] Correggere bug che non scala correttamente i check-in incompleti ma duplica l'articolo con la quantità totale richiesta al checkout e lo stesso articolo nella quantità rimasta
5) [x] Modifica articolo (aggiungere matitina vicino a i cerchiata) per modificare l'articolo e le sue caratteristiche
6) [x] Setup per produzione
7) [x] Branding e Styling
