#!/bin/bash
# ==============================================
#  COVINOR Régleur — Mise à jour rapide
#  Usage: chmod +x update.sh && ./update.sh
# ==============================================

set -e

GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}🔄 Mise à jour COVINOR Régleur...${NC}"

# Build
echo "📦 Build de l'application..."
npm run build

# Deploy
read -p "🌐 IP ou domaine du VPS : " VPS_HOST
read -p "👤 Utilisateur SSH [root] : " SSH_USER
SSH_USER=${SSH_USER:-root}

echo "🚀 Envoi des fichiers..."
scp -r dist/* ${SSH_USER}@${VPS_HOST}:/var/www/covinor/

echo -e "${GREEN}✅ Mise à jour terminée !${NC}"
echo "   Visitez http://${VPS_HOST}"
