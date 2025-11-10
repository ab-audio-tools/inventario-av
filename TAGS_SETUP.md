# Sistema Tag - Istruzioni per l'Implementazione

## ✅ Modifiche Effettuate

### 1. Schema Database (Prisma)
- **Nuovo modello `Tag`**: gestisce i tag con nome e colore
- **Nuovo modello `ItemTag`**: relazione many-to-many tra Item e Tag
- Aggiunta relazione `tags` al modello `Item`

### 2. API Routes
- **`/api/tags`**: GET (lista tag), POST (crea tag)
- **`/api/tags/[id]`**: DELETE (elimina tag), PATCH (modifica tag)
- Aggiornate API items per gestire i tag (`/api/items` e `/api/items/[id]`)

### 3. Componenti UI
- **`/app/tags/page.tsx`**: Pagina di gestione tag (simile a categorie)
- **`ItemCard.tsx`**: Mostra i tag sotto il selettore di quantità
- **`ItemEditModal.tsx`**: Selettore tag nel form di modifica
- **`/app/items/new/page.tsx`**: Selettore tag nel form di creazione
- **`Navbar.tsx`**: Aggiunto link "Tag" per Admin/Tech

### 4. Funzionalità Tag
- ✅ Creazione tag con nome e colore (10 colori predefiniti)
- ✅ Modifica nome e colore dei tag
- ✅ Eliminazione tag (cancellazione a cascata)
- ✅ Assegnazione multipla tag agli articoli
- ✅ Visualizzazione tag colorati nelle card
- ✅ Contatore articoli per tag

## 🚀 Come Completare l'Implementazione

### Step 1: Esegui la Migrazione del Database

```bash
# Naviga nella directory del progetto
cd /Users/antoniobosco/Desktop/DEVELOPER/inventario-av

# Esegui la migrazione
npx prisma migrate dev --name add_tags

# Oppure, se vuoi creare la migrazione senza eseguirla subito:
npx prisma migrate dev --create-only --name add_tags
```

### Step 2: Rigenera il Client Prisma

```bash
npx prisma generate
```

Questo comando aggiornerà il client Prisma con i nuovi modelli `Tag` e `ItemTag`, eliminando gli errori TypeScript.

### Step 3: Verifica la Migrazione

```bash
# Visualizza lo schema del database
npx prisma studio
```

### Step 4: (Opzionale) Popola il Database con Tag di Esempio

Crea alcuni tag di esempio per testare:

```bash
# Usa Prisma Studio oppure crea uno script seed
```

Oppure usa l'interfaccia web:
1. Avvia l'applicazione: `npm run dev`
2. Vai su `/tags`
3. Crea i tuoi primi tag

## 📊 Struttura Database

### Tabella `Tag`
```sql
CREATE TABLE "Tag" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "color" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### Tabella `ItemTag` (relazione)
```sql
CREATE TABLE "ItemTag" (
  "itemId" INTEGER NOT NULL,
  "tagId" INTEGER NOT NULL,
  PRIMARY KEY ("itemId", "tagId"),
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE,
  FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE
);
```

## 🎨 Colori Predefiniti

L'interfaccia offre 10 colori predefiniti:
- Blu (#3b82f6)
- Verde (#10b981)
- Rosso (#ef4444)
- Giallo (#f59e0b)
- Viola (#8b5cf6)
- Rosa (#ec4899)
- Indigo (#6366f1)
- Teal (#14b8a6)
- Arancione (#f97316)
- Grigio (#6b7280)

## 🔄 Esempio di Utilizzo

### Creare un Tag via API
```javascript
const response = await fetch('/api/tags', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Audio',
    color: '#3b82f6'
  })
});
```

### Assegnare Tag a un Articolo
```javascript
const response = await fetch('/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // ... altri campi
    tagIds: [1, 2, 3] // ID dei tag
  })
});
```

## 📝 Note Importanti

1. **Eliminazione a Cascata**: Quando elimini un tag, vengono automaticamente rimosse tutte le associazioni con gli articoli (ma gli articoli rimangono)

2. **Tag Multipli**: Un articolo può avere più tag contemporaneamente

3. **Permessi**: Solo utenti con ruolo ADMIN o TECH possono gestire i tag

4. **Visualizzazione**: I tag sono visibili a tutti gli utenti nelle card degli articoli

## 🐛 Troubleshooting

Se vedi errori TypeScript dopo le modifiche:
1. Assicurati di aver eseguito `npx prisma generate`
2. Riavvia il server di sviluppo
3. Riavvia l'editor VS Code per aggiornare il type checking

Se la migrazione fallisce:
1. Verifica la connessione al database
2. Controlla che DATABASE_URL sia configurato correttamente
3. Verifica che non ci siano dati in conflitto

## ✨ Prossimi Passi

Dopo aver eseguito la migrazione, puoi:
1. Accedere a `/tags` per creare i tuoi primi tag
2. Modificare gli articoli esistenti per assegnare tag
3. Creare nuovi articoli con tag già assegnati
4. Usare i tag per filtrare e organizzare il tuo inventario
