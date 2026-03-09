#!/bin/bash
# =============================================================
#  COVINOR Régleur — Mise à jour VPS (sans casser)
#  Met à jour le frontend + backend depuis Git
#  Ajoute les nouvelles tables sans toucher aux données
#  Usage: chmod +x update.sh && sudo ./update.sh [URL_GIT]
# =============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   COVINOR Régleur — Mise à jour VPS   ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

APP_DIR="/var/www/covinor"
SERVER_DIR="/opt/covinor-server"
BUILD_DIR="/tmp/covinor-update"
GIT_URL="${1}"

if [ -z "$GIT_URL" ]; then
  read -p "🔗 URL du repo Git : " GIT_URL
fi

# --- 1. Clone ---
echo -e "${GREEN}[1/5]${NC} Clonage du repo..."
rm -rf ${BUILD_DIR}
git clone ${GIT_URL} ${BUILD_DIR}
echo "  ✓ Repo cloné"

# --- 2. Build frontend ---
echo -e "${GREEN}[2/5]${NC} Build du frontend..."
cd ${BUILD_DIR}
npm install --legacy-peer-deps
npm run build
echo "  ✓ Frontend compilé"

# --- 3. MariaDB — ajouter les nouvelles tables (sans toucher à l'existant) ---
echo -e "${GREEN}[3/5]${NC} Mise à jour MariaDB (ajout tables manquantes)..."

MYSQL_CMD="mysql"
if command -v mariadb &> /dev/null; then
  MYSQL_CMD="mariadb"
fi

# Lire les infos de connexion depuis le .env existant
if [ -f "${SERVER_DIR}/.env" ]; then
  export $(cat ${SERVER_DIR}/.env | grep -v '^#' | xargs) 2>/dev/null
fi

DB_NAME="${MYSQL_DATABASE:-covinor_regleur}"
DB_USER="${MYSQL_USER:-covinor}"
DB_PASS="${MYSQL_PASSWORD}"

if [ -z "$DB_PASS" ]; then
  read -sp "🔑 Mot de passe MariaDB pour '${DB_USER}' : " DB_PASS
  echo ""
fi

$MYSQL_CMD -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" <<'SQL'
-- Ajouter la table app_settings si elle n'existe pas
CREATE TABLE IF NOT EXISTS app_settings (
  keyname VARCHAR(100) NOT NULL PRIMARY KEY,
  val VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- S'assurer que la table users existe
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL

echo "  ✓ Tables à jour (données existantes préservées)"

# --- 4. Déployer ---
echo -e "${GREEN}[4/5]${NC} Déploiement..."

# Frontend
cp -r ${BUILD_DIR}/dist/* ${APP_DIR}/
chown -R www-data:www-data ${APP_DIR}
echo "  ✓ Frontend mis à jour"

# Backend — préserver le .env existant
cp ${SERVER_DIR}/.env /tmp/covinor-env-backup 2>/dev/null
cp -r ${BUILD_DIR}/server/* ${SERVER_DIR}/
cp /tmp/covinor-env-backup ${SERVER_DIR}/.env 2>/dev/null
chmod +x ${SERVER_DIR}/start.sh ${SERVER_DIR}/stop.sh 2>/dev/null
cd ${SERVER_DIR} && npm install --production
echo "  ✓ Backend mis à jour (.env préservé)"

# --- 5. Redémarrer ---
echo -e "${GREEN}[5/5]${NC} Redémarrage du backend..."
screen -S covinor-api -X quit 2>/dev/null
sleep 1
screen -dmS covinor-api bash -c "cd ${SERVER_DIR} && export \$(cat .env | xargs) && node server.js"
sleep 1

if screen -list | grep -q "covinor-api"; then
  echo "  ✓ Backend redémarré"
else
  echo -e "${YELLOW}  ⚠ Échec — lancez : cd ${SERVER_DIR} && ./start.sh${NC}"
fi

# Nettoyage
rm -rf ${BUILD_DIR} /tmp/covinor-env-backup

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Mise à jour terminée !${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Testez : ${GREEN}http://$(hostname -I | awk '{print $1}')${NC}"
echo -e "  📡 API :    ${GREEN}curl http://localhost:3001/api/health${NC}"
echo ""
