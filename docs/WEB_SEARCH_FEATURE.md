# Funzionalità "Cerca sul web" - Riepilogo Implementazione

## ✅ Modifiche Effettuate

### 1. Nuovi Componenti
- **`ImageWebSearch.tsx`**: Modale per cercare e selezionare immagini da Google
  - Interfaccia a griglia con le prime 10 immagini trovate
  - Preview al passaggio del mouse
  - Selezione con un click

### 2. Nuove API Routes
- **`/api/search-images`**: Cerca immagini usando Google Custom Search API
  - Parametro: `q` (query di ricerca)
  - Restituisce array di immagini con URL, thumbnail, titolo e fonte
  
- **`/api/download-image`**: Scarica un'immagine dal web e la carica su Cloudinary o locale
  - Parametro: `imageUrl` (URL dell'immagine da scaricare)
  - Restituisce l'URL finale dell'immagine caricata

### 3. Componenti Modificati
- **`ImageUploader.tsx`**: 
  - Aggiunto prop `searchQuery` (opzionale)
  - Aggiunto pulsante "🔍 Cerca sul web" che appare solo se `searchQuery` è fornito
  - Integrato con il modale `ImageWebSearch`

- **`ItemEditModal.tsx`**:
  - Passa `searchQuery` all'ImageUploader con il formato: `brand + model` o `name`

- **`/app/items/new/page.tsx`**:
  - Passa `searchQuery` all'ImageUploader con il formato: `brand + model` o `name`

### 4. File di Configurazione
- **`.env.example`**: Aggiunte variabili `GOOGLE_API_KEY` e `GOOGLE_SEARCH_ENGINE_ID`
- **`GOOGLE_SEARCH_SETUP.md`**: Guida completa per configurare Google Custom Search API
- **`/public/placeholder.svg`**: Immagine placeholder per immagini non disponibili

## 🎯 Come Funziona

1. **Crea/Modifica Articolo**: L'utente inserisce Brand + Modello (o Nome)
2. **Click "Cerca sul web"**: Si apre il modale di ricerca
3. **Ricerca Automatica**: Usa Google per cercare immagini relative all'articolo
4. **Selezione**: L'utente sceglie tra le prime 10 immagini
5. **Download & Upload**: L'immagine viene scaricata e ricaricata su Cloudinary/locale
6. **Assegnazione**: L'URL finale viene assegnato all'articolo

## 🔧 Configurazione Richiesta

Per abilitare la funzionalità, segui la guida in `GOOGLE_SEARCH_SETUP.md`:

1. Crea un progetto Google Cloud
2. Ottieni una Google API Key
3. Abilita Custom Search API
4. Crea un Custom Search Engine
5. Configura le variabili d'ambiente

### Variabili d'Ambiente

```bash
GOOGLE_API_KEY=la_tua_api_key
GOOGLE_SEARCH_ENGINE_ID=il_tuo_search_engine_id
```

## 💡 Funzionamento Senza API

Se le API non sono configurate:
- Il pulsante "Cerca sul web" sarà comunque visibile
- Mostrerà un messaggio di errore quando viene usato
- Il resto dell'applicazione funziona normalmente
- Gli utenti possono comunque caricare immagini manualmente

## 🎨 UI/UX

- **Pulsante**: Verde smeraldo con icona 🔍
- **Modale**: Griglia responsive (2-4 colonne)
- **Hover**: Overlay scuro con testo "Seleziona"
- **Loading**: Spinner durante la ricerca
- **Errori**: Messaggi informativi in caso di problemi

## 📊 Limiti Google API

- **Gratuito**: 100 query/giorno
- **A pagamento**: $5 per 1000 query aggiuntive
- **Max**: 10.000 query/giorno

## 🚀 Vantaggi

- ✅ Velocizza il caricamento delle immagini
- ✅ Trova immagini professionali e di alta qualità
- ✅ Nessun bisogno di cercare manualmente su Google
- ✅ Integrazione seamless con il workflow esistente
- ✅ Funziona sia con Cloudinary che con storage locale
