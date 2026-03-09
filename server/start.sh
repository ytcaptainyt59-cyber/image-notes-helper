#!/bin/bash
# ==============================================
#  COVINOR Régleur — Lancement backend en screen
#  Usage: chmod +x start.sh && ./start.sh
# ==============================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCREEN_NAME="covinor-api"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   COVINOR Backend — Démarrage         ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier si screen est installé
if ! command -v screen &> /dev/null; then
  echo -e "${YELLOW}Installation de screen...${NC}"
  sudo apt install -y screen
fi

# Vérifier si le .env existe
if [ ! -f "$DIR/.env" ]; then
  echo -e "${YELLOW}⚠ Fichier .env introuvable !${NC}"
  echo "  Copie du template..."
  cp "$DIR/.env.example" "$DIR/.env"
  echo -e "${YELLOW}  → Éditez ${DIR}/.env avec vos identifiants MySQL${NC}"
  echo "    nano ${DIR}/.env"
  exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "$DIR/node_modules" ]; then
  echo -e "${GREEN}📦 Installation des dépendances...${NC}"
  cd "$DIR" && npm install
fi

# Tuer l'ancien screen si existant
screen -S "$SCREEN_NAME" -X quit 2>/dev/null

# Charger les variables d'env et lancer en screen
echo -e "${GREEN}🚀 Lancement du backend en screen '${SCREEN_NAME}'...${NC}"
screen -dmS "$SCREEN_NAME" bash -c "cd $DIR && export \$(cat .env | xargs) && node server.js"

sleep 1

# Vérifier que le screen tourne
if screen -list | grep -q "$SCREEN_NAME"; then
  echo -e "${GREEN}✅ Backend démarré !${NC}"
  echo ""
  echo -e "  📡 API :    ${GREEN}http://localhost:3001${NC}"
  echo ""
  echo -e "  ${BLUE}Commandes utiles :${NC}"
  echo "    screen -r ${SCREEN_NAME}    → Voir les logs"
  echo "    Ctrl+A puis D              → Détacher le screen"
  echo "    screen -S ${SCREEN_NAME} -X quit → Arrêter"
  echo ""
else
  echo -e "${YELLOW}⚠ Le screen n'a pas démarré. Vérifiez le .env${NC}"
  echo "  Testez manuellement : cd $DIR && node server.js"
fi
