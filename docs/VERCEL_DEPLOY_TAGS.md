# 🚀 Deploy su Vercel - Sistema Tag

## ✅ Fix Applicato

Ho corretto l'errore di build su Vercel aggiornando la route API `/api/tags/[id]` per essere compatibile con **Next.js 15**.

### Problema
```
Type '{ params: Promise<{ id: string; }>; }' is not assignable to type '{ params: { id: string; }; }'.
```

### Soluzione
In Next.js 15, il parametro `params` nelle route API dinamiche è una **Promise** che deve essere awaited.

**Prima:**
```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tagId = parseInt(params.id);
  // ...
}
```

**Dopo:**
```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tagId = parseInt(id);
  // ...
}
```

## 📋 Checklist Pre-Deploy

### 1. Variabili d'Ambiente su Vercel

Assicurati di aver configurato queste variabili nel dashboard Vercel:

#### Database (Obbligatorio)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

#### Email (Opzionale)
```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_user
EMAIL_PASS=your_pass
EMAIL_FROM=Inventario AV <noreply@example.com>
EMAIL_NOTIFY=magazzino@example.com
```

#### Google Search (Opzionale - per ricerca immagini web)
```
GOOGLE_API_KEY=your_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

#### Cloudinary (Opzionale - per upload immagini)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### 2. Build Command su Vercel

Vercel dovrebbe usare automaticamente:
```bash
npx prisma generate && npx prisma migrate deploy && next build
```

Questo:
- ✅ Genera il client Prisma con i modelli Tag e ItemTag
- ✅ Applica le migrazioni pending (inclusa quella dei tag)
- ✅ Compila Next.js

### 3. Verifica Database

Il database su Vercel (Neon) deve avere:
- ✅ Tabella `Tag`
- ✅ Tabella `ItemTag`
- ✅ Migrazione `20251110000000_add_tags` registrata

Se la migrazione dei tag non è stata applicata sul DB di produzione, Vercel la applicherà automaticamente con `migrate deploy`.

## 🔍 Test Post-Deploy

Dopo il deploy, testa:

1. **Homepage** - `/`
   - Gli articoli si caricano?
   - Le card si visualizzano?

2. **Gestione Tag** - `/tags`
   - La pagina si carica?
   - Puoi creare un tag?

3. **Nuovo Articolo** - `/items/new`
   - Il selettore tag appare?
   - Puoi assegnare tag?

4. **Card con Tag**
   - I tag appaiono sotto il selettore quantità?
   - I colori sono corretti?

## ⚠️ Troubleshooting Vercel

### Build Fallisce: "Property 'tag' does not exist"

**Causa**: Il client Prisma non è stato generato correttamente.

**Soluzione**:
1. Verifica che `prisma generate` sia nel build command
2. Controlla i log di build di Vercel
3. Assicurati che `prisma/schema.prisma` includa i modelli Tag e ItemTag

### Runtime Error: "Tabella Tag non trovata"

**Causa**: La migrazione non è stata applicata al database di produzione.

**Soluzione**:
1. Verifica che `DATABASE_URL` sia configurato correttamente
2. Il build command include `prisma migrate deploy`
3. Controlla i log di deploy per errori di migrazione

### Errore: "Migration ... was modified after applied"

**Causa**: Stessa che abbiamo risolto in locale.

**Soluzione**: Su Vercel questo non dovrebbe succedere perché:
- `migrate deploy` applica solo le migrazioni pending
- Non controlla le modifiche alle migrazioni già applicate
- È safe per produzione

## 📊 Verifica Migrazione su Database Produzione

Se vuoi verificare manualmente che la migrazione sia stata applicata:

```sql
-- Connettiti al database Neon e esegui:

-- Verifica tabella Tag
SELECT * FROM "Tag" LIMIT 1;

-- Verifica tabella ItemTag  
SELECT * FROM "ItemTag" LIMIT 1;

-- Verifica migrazione registrata
SELECT * FROM "_prisma_migrations" 
WHERE migration_name = '20251110000000_add_tags';
```

## 🎯 Prossimi Passi

1. **Commit e Push**:
   ```bash
   git add .
   git commit -m "feat: add tags system"
   git push origin main
   ```

2. **Vercel Deploy Automatico**:
   - Vercel rileva il push e avvia il build
   - Monitora i log di build
   - Attendi il deploy

3. **Test Produzione**:
   - Vai su `your-app.vercel.app/tags`
   - Crea i primi tag
   - Assegna tag agli articoli

## ✅ Fix Applicati in Questo Commit

- ✅ Aggiornata route `/api/tags/[id]` per Next.js 15
- ✅ `params` ora è una Promise (await params)
- ✅ Compatibile con Vercel build
- ✅ Nessun cambio al database o logica

---

**Il sistema tag è pronto per il deploy su Vercel!** 🚀
