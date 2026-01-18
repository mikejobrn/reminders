#!/bin/bash

# Script para popular o banco de produção com dados de teste
# Execute este script localmente para criar usuários de teste

echo "🌱 Populando banco de produção..."
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

# Roda o seed
npx prisma db seed

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Seed executado com sucesso!"
  echo ""
  echo "Usuários criados:"
  echo "  Email: user@example.com"
  echo "  Senha: password123"
  echo ""
  echo "Tente fazer login em: https://lembretesmyklan.vercel.app/login"
else
  echo ""
  echo "❌ Erro ao executar seed"
  exit 1
fi
