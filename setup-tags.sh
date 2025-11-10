#!/bin/bash

echo "🏷️  Setup Sistema Tag"
echo "===================="
echo ""

echo "📊 Step 1: Creazione migrazione database..."
npx prisma migrate dev --name add_tags

if [ $? -eq 0 ]; then
    echo "✅ Migrazione creata con successo!"
else
    echo "❌ Errore durante la migrazione"
    exit 1
fi

echo ""
echo "🔧 Step 2: Generazione client Prisma..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Client Prisma generato con successo!"
else
    echo "❌ Errore durante la generazione del client"
    exit 1
fi

echo ""
echo "🌱 Step 3: Vuoi popolare il database con tag di esempio? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    npx tsx prisma/seed-tags.ts
    if [ $? -eq 0 ]; then
        echo "✅ Tag di esempio creati!"
    else
        echo "⚠️  Errore durante il seeding (opzionale)"
    fi
else
    echo "⏭️  Seeding saltato"
fi

echo ""
echo "✨ Setup completato!"
echo ""
echo "📝 Prossimi passi:"
echo "  1. Riavvia il server: npm run dev"
echo "  2. Vai su /tags per creare i tuoi primi tag"
echo "  3. Assegna tag agli articoli"
echo ""
echo "📚 Per maggiori informazioni, leggi:"
echo "  - TAG_SYSTEM_SUMMARY.md"
echo "  - TAGS_SETUP.md"
