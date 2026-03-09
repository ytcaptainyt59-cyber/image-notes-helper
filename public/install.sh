#!/bin/bash
# =============================================================
#  COVINOR Régleur — Script d'installation VPS (Ubuntu/Debian)
#  Usage: chmod +x install.sh && sudo ./install.sh
# =============================================================

set -e

# --- Couleurs ---
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
read -p "🌐 Nom de domaine (ou IP du VPS, ex: covinor.monsite.fr) : " DOMAIN
read -p "🗄️  Nom de la base MySQL [covinor_regleur] : " DB_NAME
DB_NAME=${DB_NAME:-covinor_regleur}
read -p "👤 Utilisateur MySQL [covinor] : " DB_USER
DB_USER=${DB_USER:-covinor}
read -sp "🔑 Mot de passe MySQL : " DB_PASS
echo ""
read -p "👤 Nom d'utilisateur app (login) [admin] : " APP_USER
APP_USER=${APP_USER:-admin}
read -sp "🔑 Mot de passe app (login) : " APP_PASS
echo ""

APP_DIR="/var/www/covinor"

# --- 1. Mise à jour système ---
echo -e "\n${GREEN}[1/6]${NC} Mise à jour du système..."
apt update -qq && apt upgrade -y -qq

# --- 2. Installation des paquets ---
echo -e "${GREEN}[2/6]${NC} Installation de Nginx, MySQL, Node.js..."
apt install -y -qq nginx mysql-server curl

# Node.js 20 LTS
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y -qq nodejs
fi

echo "  ✓ Node $(node -v) | npm $(npm -v) | Nginx $(nginx -v 2>&1 | cut -d/ -f2)"

# --- 3. Configuration MySQL ---
echo -e "${GREEN}[3/6]${NC} Configuration de MySQL..."

# Hash SHA-256 du mot de passe app
APP_PASS_HASH=$(echo -n "$APP_PASS" | sha256sum | awk '{print $1}')

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;

USE \`${DB_NAME}\`;

CREATE TABLE IF NOT EXISTS fiches (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  codeProduit VARCHAR(255) DEFAULT '',
  reference VARCHAR(255) DEFAULT '',
  dateApplication VARCHAR(255) DEFAULT '',
  designation VARCHAR(255) DEFAULT '',
  client VARCHAR(255) DEFAULT '',
  marque VARCHAR(255) DEFAULT '',
  gencod VARCHAR(255) DEFAULT '',
  bouteille VARCHAR(255) DEFAULT '',
  bouchon VARCHAR(255) DEFAULT '',
  etiquette VARCHAR(255) DEFAULT '',
  colle VARCHAR(255) DEFAULT '',
  dluo VARCHAR(255) DEFAULT '',
  carton VARCHAR(255) DEFAULT '',
  collerCarton VARCHAR(255) DEFAULT '',
  etiquetteCarton VARCHAR(255) DEFAULT '',
  intercalaire VARCHAR(255) DEFAULT '',
  typePalette VARCHAR(255) DEFAULT '',
  palettisation VARCHAR(255) DEFAULT '',
  uvcParCarton VARCHAR(255) DEFAULT '',
  cartonsParCouche VARCHAR(255) DEFAULT '',
  couchesParPalette VARCHAR(255) DEFAULT '',
  uvcParPalette VARCHAR(255) DEFAULT '',
  filmEtirable VARCHAR(255) DEFAULT '',
  etiquettePalette VARCHAR(255) DEFAULT '',
  imageUrl LONGTEXT,
  notes TEXT DEFAULT NULL,
  createdAt VARCHAR(30) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS format_notes (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) DEFAULT '',
  content TEXT DEFAULT NULL,
  keywords JSON DEFAULT NULL,
  machines JSON DEFAULT NULL,
  createdAt VARCHAR(30) DEFAULT '',
  updatedAt VARCHAR(30) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO users (id, username, password_hash) VALUES (
  UUID(), '${APP_USER}', '${APP_PASS_HASH}'
);
EOF

echo "  ✓ Base ${DB_NAME} créée avec utilisateur '${APP_USER}'"

# --- 4. Déploiement de l'app ---
echo -e "${GREEN}[4/6]${NC} Déploiement de l'application..."
mkdir -p ${APP_DIR}

# Si le dossier dist existe dans le répertoire courant, on le copie
if [ -d "./dist" ]; then
  cp -r ./dist/* ${APP_DIR}/
  echo "  ✓ Fichiers copiés depuis ./dist"
else
  echo -e "${YELLOW}  ⚠ Dossier ./dist introuvable.${NC}"
  echo "  Faites 'npm run build' puis copiez le contenu de dist/ dans ${APP_DIR}/"
fi

chown -R www-data:www-data ${APP_DIR}

# --- 5. Configuration Nginx ---
echo -e "${GREEN}[5/6]${NC} Configuration de Nginx..."

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
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Headers sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINX

ln -sf /etc/nginx/sites-available/covinor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "  ✓ Nginx configuré pour ${DOMAIN}"

# --- 6. SSL avec Let's Encrypt (optionnel) ---
echo -e "${GREEN}[6/6]${NC} SSL (Let's Encrypt)..."

if [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${YELLOW}  ⚠ IP détectée — SSL ignoré (nécessite un nom de domaine)${NC}"
else
  if ! command -v certbot &> /dev/null; then
    apt install -y -qq certbot python3-certbot-nginx
  fi
  certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --register-unsafely-without-email || \
    echo -e "${YELLOW}  ⚠ Certbot a échoué — configurez SSL manuellement plus tard${NC}"
fi

# --- Résumé ---
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Installation terminée !${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 URL :         ${GREEN}http://${DOMAIN}${NC}"
echo -e "  👤 Login :        ${GREEN}${APP_USER}${NC}"
echo -e "  🗄️  Base MySQL :  ${GREEN}${DB_NAME}${NC}"
echo -e "  📁 Fichiers :     ${APP_DIR}"
echo ""
echo -e "${YELLOW}  Pour mettre à jour l'app :${NC}"
echo "  1. npm run build (sur votre PC)"
echo "  2. scp -r dist/* root@${DOMAIN}:${APP_DIR}/"
echo ""
