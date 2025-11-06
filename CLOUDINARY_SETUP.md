# 🚀 Setup Cloudinary CDN per Upload Immagini

## 📋 Cos'è Cloudinary?

**Cloudinary** è un servizio CDN completo per gestione media con piano gratuito generoso:
- ✅ **25 GB storage gratuito**
- ✅ **25 GB bandwidth/mese gratuito**
- ✅ CDN globale veloce
- ✅ Trasformazioni immagini automatiche (resize, crop, ottimizzazione)
- ✅ Upload widget integrato
- ✅ Gestione via dashboard web

Dopo il piano gratuito:
- 💰 Piano Plus: $89/mese (100 GB storage, 100 GB bandwidth)

---

## 🎯 Setup Passo-Passo

### 1. Crea Account Cloudinary

1. Vai su [Cloudinary - Sign Up](https://cloudinary.com/users/register_free)
2. Registrati gratuitamente (email, Google, GitHub)
3. Verifica l'email
4. Completa il questionario iniziale (puoi saltare)

### 2. Ottieni le Credenziali

Nel **Dashboard Cloudinary** troverai:

```
Cloud Name: dxxxxxxxxxxxxx
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz123
```

📝 **Importante**: Salva queste credenziali in un posto sicuro!

### 3. Crea Upload Preset (per upload senza firma)

1. Nel Dashboard → **Settings** (⚙️ in alto a destra)
2. Vai su tab **Upload**
3. Scroll fino a **"Upload presets"**
4. Clicca **"Add upload preset"**
5. Configura:
   - **Preset name**: `inventario-av-uploads` (o il nome che preferisci)
   - **Signing Mode**: **Unsigned** ⚠️ (importante!)
   - **Folder**: `inventario-av` (opzionale, per organizzare)
   - **Allowed formats**: `jpg, png, webp, gif`
   - **Max file size**: `10485760` (10 MB in bytes)
   - Lascia il resto di default
6. Clicca **"Save"**
7. Copia il **Preset name** (lo userai nel codice)

---

## 🔧 Configurazione Progetto

### 1. Aggiungi Variabili d'Ambiente

Modifica il file `.env`:

```bash
# Cloudinary CDN
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxxx
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=inventario-av-uploads
```

⚠️ **Nota**: Usiamo `NEXT_PUBLIC_` perché l'upload avviene dal client (browser)

Aggiorna anche `.env.example`:

```bash
# Cloudinary CDN (per upload immagini)
# Ottieni le credenziali da: https://cloudinary.com/console
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 2. Configura Vercel

Nel **Dashboard Vercel** → Settings → Environment Variables, aggiungi:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = dxxxxxxxxxxxxx
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = inventario-av-uploads
```

Poi **Redeploy** il progetto.

---

## 💻 Implementazione Codice

### Modifica: `src/components/ImageUploader.tsx`

Aggiorna il componente per supportare Cloudinary:

```typescript
"use client";
import { useCallback, useRef, useState } from "react";

type Props = {
  value?: string;
  onUploaded: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
};

export default function ImageUploader({ value, onUploaded, label = "Immagine", maxSizeMB = 10 }: Props) {
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Controlla se Cloudinary è configurato
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const useCloudinary = Boolean(cloudinaryCloudName && cloudinaryUploadPreset);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", cloudinaryUploadPreset!);
    fd.append("folder", "inventario-av");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
      { method: "POST", body: fd }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.error?.message || "Upload Cloudinary fallito");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const uploadToLocal = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Upload fallito");
    }

    return data.url;
  };

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      alert("Carica un'immagine (png, jpg, webp...)");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Immagine troppo grande (max ${maxSizeMB}MB)`);
      return;
    }

    // anteprima immediata
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const url = useCloudinary 
        ? await uploadToCloudinary(file)
        : await uploadToLocal(file);
      
      onUploaded(url);
      setPreview(url);
    } catch (e: any) {
      setPreview(value || null);
      alert(e.message || "Errore di rete durante l'upload");
    } finally {
      setUploading(false);
    }
  }, [maxSizeMB, onUploaded, value, useCloudinary, cloudinaryCloudName, cloudinaryUploadPreset]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {label && <label className="text-sm text-zinc-600">{label}</label>}
        {useCloudinary && (
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
            ☁️ Cloudinary
          </span>
        )}
      </div>

      <div
        className={`mt-1 rounded-2xl border-2 border-dashed p-4 transition
          ${drag ? "border-emerald-500 bg-emerald-50" : "border-zinc-300 hover:border-zinc-400"}
          ${uploading ? "opacity-70" : ""}
        `}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="preview" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-xs text-zinc-400">Nessuna immagine</span>
            )}
          </div>

          <div className="flex-1">
            <div className="text-sm">
              Trascina un'immagine qui
              <span className="mx-1 text-zinc-400">oppure</span>
              <button
                type="button"
                className="underline"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                scegli file
              </button>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Formati: PNG, JPG, WEBP · Max {maxSizeMB}MB
            </div>
            {uploading && <div className="text-xs text-emerald-600 mt-1">Caricamento…</div>}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
```

---

## 📤 Caricamento Manuale Immagini

### Via Dashboard Cloudinary:

1. Accedi al [Dashboard Cloudinary](https://cloudinary.com/console)
2. Vai su **Media Library** nel menu laterale
3. Clicca **"Upload"** → **"Drop files or Browse"**
4. Carica le tue immagini
5. Organizza in cartelle (opzionale): crea cartella `inventario-av`
6. Clicca sull'immagine caricata
7. Copia il campo **"Secure URL"**

Esempio URL:
```
https://res.cloudinary.com/dxxxxx/image/upload/v1234567890/inventario-av/sample.jpg
```

8. Incolla questo URL nel campo immagine quando crei/modifichi un articolo

### Tramite API (opzionale - richiede API Secret):

```bash
curl -X POST "https://api.cloudinary.com/v1_1/{cloud_name}/image/upload" \
  -F "file=@/path/to/image.jpg" \
  -F "api_key={api_key}" \
  -F "timestamp={timestamp}" \
  -F "signature={signature}" \
  -F "folder=inventario-av"
```

---

## 🔄 Migrazione Immagini Esistenti

Se hai già immagini in `/public/uploads`:

### Script: `scripts/migrate-to-cloudinary.js`

```javascript
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: 'YOUR_API_KEY',      // ⚠️ Non usare NEXT_PUBLIC per API Key/Secret
  api_secret: 'YOUR_API_SECRET'  // ⚠️ Prendili dal dashboard (non nel .env pubblico)
});

const uploadsDir = path.join(__dirname, '../public/uploads');

async function migrate() {
  try {
    const files = await fs.promises.readdir(uploadsDir);
    console.log(`📦 Trovati ${files.length} file da migrare...\n`);

    for (const file of files) {
      const filepath = path.join(uploadsDir, file);
      const stats = await fs.promises.stat(filepath);
      
      if (!stats.isFile()) continue;

      try {
        const result = await cloudinary.uploader.upload(filepath, {
          folder: 'inventario-av',
          public_id: path.parse(file).name,
          overwrite: false,
        });
        
        console.log(`✅ ${file}`);
        console.log(`   → ${result.secure_url}\n`);
      } catch (error) {
        console.error(`❌ Errore ${file}:`, error.message);
      }
    }

    console.log('🎉 Migrazione completata!');
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

migrate();
```

### Esegui lo script:

```bash
# Installa cloudinary SDK
npm install cloudinary

# Esegui migrazione
node scripts/migrate-to-cloudinary.js
```

⚠️ **Importante**: Per lo script di migrazione hai bisogno di `API Key` e `API Secret` (non `NEXT_PUBLIC_`). Trovale nel Dashboard → Settings → API Keys.

---

## 🎨 Trasformazioni Immagini

Uno dei vantaggi di Cloudinary sono le trasformazioni automatiche via URL:

### Esempi:

**Immagine originale:**
```
https://res.cloudinary.com/dxxxxx/image/upload/v1234567890/inventario-av/sample.jpg
```

**Ridimensiona a 300x300:**
```
https://res.cloudinary.com/dxxxxx/image/upload/w_300,h_300,c_fill/v1234567890/inventario-av/sample.jpg
```

**Ottimizza automaticamente:**
```
https://res.cloudinary.com/dxxxxx/image/upload/f_auto,q_auto/v1234567890/inventario-av/sample.jpg
```

**Thumbnail per card (opzionale):**

Puoi modificare `ItemCard.tsx` per usare thumbnail ottimizzate:

```typescript
// Prima:
<img src={item.imageUrl} alt="..." />

// Dopo (con Cloudinary):
<img src={item.imageUrl?.replace('/upload/', '/upload/w_200,h_200,c_fill,f_auto,q_auto/')} alt="..." />
```

---

## 🧪 Test

### 1. Test in Locale:

```bash
# Aggiungi le variabili nel .env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxx
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=inventario-av-uploads

# Riavvia il server
npm run dev
```

### 2. Crea un nuovo articolo:

1. Vai su `/items/new`
2. Carica un'immagine
3. Controlla che:
   - Appaia il badge "☁️ Cloudinary" sopra l'uploader
   - L'URL salvato sia tipo: `https://res.cloudinary.com/dxxxxx/...`

### 3. Verifica nel Dashboard Cloudinary:

1. Vai su Media Library
2. Dovresti vedere la cartella `inventario-av` con l'immagine

---

## 🎯 Vantaggi Cloudinary

| Feature | Cloudinary | Filesystem Locale | R2 |
|---------|:---------:|:-----------------:|:--:|
| Storage gratuito | 25 GB | ∞ (ma effimero) | 10 GB |
| Bandwidth gratuito | 25 GB/mese | - | ∞ |
| CDN globale | ✅ | ❌ | ✅ |
| Trasformazioni immagini | ✅ | ❌ | ❌ |
| Ottimizzazione automatica | ✅ | ❌ | ❌ |
| Resize dinamico via URL | ✅ | ❌ | ❌ |
| Dashboard web | ✅ | ❌ | ✅ |
| Funziona su Vercel | ✅ | ⚠️ Temporaneo | ✅ |

**Cloudinary è ideale se:**
- Vuoi trasformazioni automatiche (resize, crop, ottimizzazione)
- Vuoi una dashboard semplice per gestire le immagini
- 25 GB di storage e bandwidth ti bastano

---

## 🔒 Sicurezza

### Best Practices:

1. ✅ **Usa Upload Preset Unsigned** per upload dal client
2. ✅ **Non esporre API Secret** - mai nel codice client
3. ✅ **Limita i formati** nel preset (solo immagini)
4. ✅ **Imposta dimensione massima** (10 MB)
5. ✅ **Organizza in folder** (`inventario-av`) per evitare conflitti
6. ⚠️ **Rate limiting**: Cloudinary ha rate limit sul piano gratuito

### Upload Preset Security:

Nel preset, considera di abilitare:
- **Allowed formats**: solo `jpg, png, webp, gif`
- **Max file size**: `10485760` bytes (10 MB)
- **Max image dimensions**: es. `4096x4096` per evitare file enormi

---

## 📊 Monitoraggio Usage

### Dashboard Cloudinary → Reports:

Monitora:
- **Storage**: quanto spazio stai usando (limite: 25 GB)
- **Bandwidth**: traffico mensile (limite: 25 GB)
- **Transformations**: numero di trasformazioni
- **Requests**: numero di richieste API

⚠️ **Alert**: Imposta notifiche email quando ti avvicini ai limiti (Settings → Notifications)

---

## 🆘 Troubleshooting

### "Upload preset must be unsigned":
- Vai su Settings → Upload → Upload presets
- Modifica il preset → **Signing Mode: Unsigned**

### "Invalid signature":
- Stai usando `API_KEY` e `API_SECRET` nel client (non farlo!)
- Usa solo `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` e `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### Immagini non si caricano:
- Verifica che le variabili d'ambiente siano corrette
- Controlla la console del browser per errori
- Verifica che il preset esista e sia `unsigned`

### "Quota exceeded":
- Hai superato i 25 GB di storage o bandwidth
- Controlla usage nel Dashboard → Reports
- Opzioni: upgrade piano o elimina immagini vecchie

### Immagini molto lente:
- Cloudinary usa CDN globale, dovrebbe essere veloce
- Considera di usare trasformazioni `f_auto,q_auto` per ottimizzare

---

## 📚 Risorse

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Widget](https://cloudinary.com/documentation/upload_widget)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)

---

## 🚀 Next Steps

Dopo aver configurato Cloudinary:

1. ✅ Testa upload di nuove immagini
2. ✅ Migra immagini esistenti (opzionale)
3. ✅ Deploy su Vercel con le variabili d'ambiente
4. 💡 (Opzionale) Implementa trasformazioni automatiche nelle card
5. 💡 (Opzionale) Aggiungi watermark o effetti alle immagini
6. 💡 (Opzionale) Implementa video upload (Cloudinary supporta anche video!)
