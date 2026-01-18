#!/bin/bash

# Script para rodar migrations no banco de produção
# Execute este script localmente para aplicar as migrations no banco da Vercel

echo "🚀 Aplicando migrations no banco de produção..."
echo ""

# Verifica se a variável DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erro: DATABASE_URL não está definida"
  echo ""
  echo "Execute este comando:"
  echo 'export DATABASE_URL="postgresql://neondb_owner:npg_6DYjIRJ5tqcV@ep-wild-scene-ahqzsxj8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"'
  echo ""
  exit 1
fi

# Roda as migrations
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migrations aplicadas com sucesso!"
  echo ""
  echo "Agora você pode:"
  echo "1. Criar um usuário via https://lembretesmyklan.vercel.app/register"
  echo "2. Ou rodar o seed: npm run seed-production"
else
  echo ""
  echo "❌ Erro ao aplicar migrations"
  exit 1
fi
