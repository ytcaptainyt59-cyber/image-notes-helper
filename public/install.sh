#!/bin/bash
# =============================================================
#  COVINOR Régleur — Installation VPS complète (Ubuntu/Debian)
#  Installe : Nginx + MySQL + Node.js backend + app frontend
#  Usage: chmod +x install.sh && sudo ./install.sh
# =============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║     COVINOR Régleur — Installation    ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# --- Variables ---
read -p "🌐 Nom de domaine ou IP du VPS : " DOMAIN
read -p "🗄️  Nom de la base MySQL [covinor_regleur] : " DB_NAME
DB_NAME=${DB_NAME:-covinor_regleur}
read -p "👤 Utilisateur MySQL [covinor] : " DB_USER
DB_USER=${DB_USER:-covinor}
read -sp "🔑 Mot de passe MySQL : " DB_PASS
echo ""
read -p "👤 Identifiant app [admin] : " APP_USER
APP_USER=${APP_USER:-admin}
read -sp "🔑 Mot de passe app : " APP_PASS
echo ""

APP_DIR="/var/www/covinor"
SERVER_DIR="/opt/covinor-server"

# --- 1. Mise à jour ---
echo -e "\n${GREEN}[1/7]${NC} Mise à jour du système..."
apt update -qq && apt upgrade -y -qq

# --- 2. Paquets ---
echo -e "${GREEN}[2/7]${NC} Installation de Nginx, MySQL, Node.js, screen..."
apt install -y -qq nginx mysql-server screen curl

if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y -qq nodejs
fi

echo "  ✓ Node $(node -v) | Nginx | MySQL | screen"

# --- 3. MySQL ---
echo -e "${GREEN}[3/7]${NC} Configuration MySQL..."

APP_PASS_HASH=$(echo -n "$APP_PASS" | sha256sum | awk '{print $1}')

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
USE \`${DB_NAME}\`;

CREATE TABLE IF NOT EXISTS fiches (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  codeProduit VARCHAR(255) DEFAULT '', reference VARCHAR(255) DEFAULT '',
  dateApplication VARCHAR(255) DEFAULT '', designation VARCHAR(255) DEFAULT '',
  client VARCHAR(255) DEFAULT '', marque VARCHAR(255) DEFAULT '',
  gencod VARCHAR(255) DEFAULT '', bouteille VARCHAR(255) DEFAULT '',
  bouchon VARCHAR(255) DEFAULT '', etiquette VARCHAR(255) DEFAULT '',
  colle VARCHAR(255) DEFAULT '', dluo VARCHAR(255) DEFAULT '',
  carton VARCHAR(255) DEFAULT '', collerCarton VARCHAR(255) DEFAULT '',
  etiquetteCarton VARCHAR(255) DEFAULT '', intercalaire VARCHAR(255) DEFAULT '',
  typePalette VARCHAR(255) DEFAULT '', palettisation VARCHAR(255) DEFAULT '',
  uvcParCarton VARCHAR(255) DEFAULT '', cartonsParCouche VARCHAR(255) DEFAULT '',
  couchesParPalette VARCHAR(255) DEFAULT '', uvcParPalette VARCHAR(255) DEFAULT '',
  filmEtirable VARCHAR(255) DEFAULT '', etiquettePalette VARCHAR(255) DEFAULT '',
  imageUrl LONGTEXT, notes TEXT DEFAULT NULL, createdAt VARCHAR(30) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS format_notes (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) DEFAULT '', content TEXT DEFAULT NULL,
  keywords JSON DEFAULT NULL, machines JSON DEFAULT NULL,
  createdAt VARCHAR(30) DEFAULT '', updatedAt VARCHAR(30) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO users (id, username, password_hash) VALUES (UUID(), '${APP_USER}', '${APP_PASS_HASH}');
EOF

echo "  ✓ Base ${DB_NAME} prête, utilisateur '${APP_USER}' créé"

# --- 4. Backend Node.js ---
echo -e "${GREEN}[4/7]${NC} Installation du backend Node.js..."
mkdir -p ${SERVER_DIR}

# Copier les fichiers serveur
if [ -d "./server" ]; then
  cp -r ./server/* ${SERVER_DIR}/
else
  echo -e "${YELLOW}  ⚠ Dossier ./server introuvable — copiez-le manuellement dans ${SERVER_DIR}/${NC}"
fi

# Créer le .env
cat > ${SERVER_DIR}/.env <<ENVFILE
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=${DB_USER}
MYSQL_PASSWORD=${DB_PASS}
MYSQL_DATABASE=${DB_NAME}
PORT=3001
ENVFILE

cd ${SERVER_DIR} && npm install --production
echo "  ✓ Backend installé dans ${SERVER_DIR}"

# --- 5. Frontend ---
echo -e "${GREEN}[5/7]${NC} Déploiement du frontend..."
mkdir -p ${APP_DIR}

if [ -d "./dist" ]; then
  cp -r ./dist/* ${APP_DIR}/
  echo "  ✓ Frontend déployé"
else
  echo -e "${YELLOW}  ⚠ Dossier ./dist introuvable — faites 'npm run build' puis copiez dist/* dans ${APP_DIR}/${NC}"
fi

chown -R www-data:www-data ${APP_DIR}

# --- 6. Nginx ---
echo -e "${GREEN}[6/7]${NC} Configuration Nginx (frontend + proxy API)..."

cat > /etc/nginx/sites-available/covinor <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    root ${APP_DIR};
    index index.html;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    # Cache statique
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff)\$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API vers le backend Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINX

ln -sf /etc/nginx/sites-available/covinor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "  ✓ Nginx configuré (frontend + API proxy)"

# --- 7. Démarrer le backend en screen ---
echo -e "${GREEN}[7/7]${NC} Démarrage du backend en screen..."
screen -S covinor-api -X quit 2>/dev/null
screen -dmS covinor-api bash -c "cd ${SERVER_DIR} && export \$(cat .env | xargs) && node server.js"
sleep 1

if screen -list | grep -q "covinor-api"; then
  echo "  ✓ Backend démarré en screen 'covinor-api'"
else
  echo -e "${YELLOW}  ⚠ Échec du démarrage — lancez manuellement :${NC}"
  echo "    cd ${SERVER_DIR} && ./start.sh"
fi

# --- SSL ---
if [[ ! "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "\n${GREEN}[Bonus]${NC} Installation SSL..."
  if ! command -v certbot &> /dev/null; then
    apt install -y -qq certbot python3-certbot-nginx
  fi
  certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null || \
    echo -e "${YELLOW}  ⚠ SSL échoué — configurez manuellement plus tard${NC}"
fi

# --- Résumé ---
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Installation complète !${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 App :       ${GREEN}http://${DOMAIN}${NC}"
echo -e "  📡 API :       ${GREEN}http://${DOMAIN}/api/health${NC}"
echo -e "  👤 Login :      ${GREEN}${APP_USER}${NC}"
echo -e "  🗄️  MySQL :     ${GREEN}${DB_NAME}${NC}"
echo ""
echo -e "  ${BLUE}Commandes utiles :${NC}"
echo "    screen -r covinor-api          → Voir les logs backend"
echo "    Ctrl+A puis D                  → Détacher"
echo "    cd ${SERVER_DIR} && ./start.sh → Relancer"
echo "    cd ${SERVER_DIR} && ./stop.sh  → Arrêter"
echo ""
echo -e "  ${BLUE}Mise à jour frontend :${NC}"
echo "    npm run build && scp -r dist/* root@${DOMAIN}:${APP_DIR}/"
echo ""
echo -e "  ${BLUE}Mise à jour backend :${NC}"
echo "    scp -r server/* root@${DOMAIN}:${SERVER_DIR}/"
echo "    ssh root@${DOMAIN} 'cd ${SERVER_DIR} && ./stop.sh && ./start.sh'"
echo ""
