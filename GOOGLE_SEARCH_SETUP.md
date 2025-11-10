# Configurazione Google Custom Search API

Per abilitare la funzionalità "Cerca sul web" per le immagini degli articoli, devi configurare Google Custom Search API.

## 1. Ottieni una Google API Key

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona un progetto esistente
3. Vai su **API & Services** → **Credentials**
4. Clicca su **Create Credentials** → **API key**
5. Copia la tua API key
6. (Opzionale) Clicca su **Edit API key** per limitare l'uso solo a Custom Search API

## 2. Abilita Custom Search API

1. Nel Google Cloud Console, vai su **API & Services** → **Library**
2. Cerca "Custom Search API"
3. Clicca su **Enable**

## 3. Crea un Custom Search Engine

1. Vai su [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Clicca su **Get Started** o **Add**
3. Configura il tuo motore di ricerca:
   - **Sites to search**: Inserisci `www.google.com` (o lascia vuoto per cercare su tutto il web)
   - **Name**: Dai un nome (es. "Inventario AV Image Search")
   - Clicca su **Create**
4. Nella pagina di configurazione:
   - Vai su **Setup** → **Basic**
   - Abilita **Image search**: ON
   - Abilita **Search the entire web**: ON
5. Vai su **Overview** e copia il **Search engine ID** (cx)

## 4. Configura le variabili d'ambiente

Aggiungi queste variabili al tuo file `.env` (locale) e nelle impostazioni di Netlify (produzione):

```bash
GOOGLE_API_KEY=la_tua_api_key
GOOGLE_SEARCH_ENGINE_ID=il_tuo_search_engine_id
```

## 5. Limiti e Prezzi

- **Quota gratuita**: 100 query al giorno
- **Query aggiuntive**: $5 per 1000 query (fino a 10.000 query al giorno)
- Maggiori info: [Custom Search JSON API Pricing](https://developers.google.com/custom-search/v1/overview#pricing)

## Nota

Se non configuri le API key, il pulsante "Cerca sul web" sarà comunque visibile ma mostrerà un messaggio di errore quando viene utilizzato. Il resto dell'applicazione funzionerà normalmente e gli utenti potranno comunque caricare immagini manualmente.

## Alternative

Se non vuoi usare Google Custom Search API, puoi:

1. **Caricare manualmente** le immagini dal computer
2. **Usare URL diretti** di immagini già disponibili online
3. Implementare un'integrazione con altri servizi come:
   - Unsplash API (gratuita per uso non commerciale)
   - Pexels API (gratuita)
   - Bing Image Search API

