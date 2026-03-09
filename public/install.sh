#!/bin/bash
# =============================================================
#  COVINOR Régleur — Installation complète depuis Git
#  Clone le repo, build le frontend, installe tout
#  Usage: curl -sL http://TON_DOMAINE/install.sh | sudo bash
#    ou : chmod +x install.sh && sudo ./install.sh
# =============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   COVINOR Régleur — Installation VPS  ║"
echo "  ║   Git + Build + Apache2 + MariaDB     ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# --- Variables ---
read -p "🔗 URL du repo Git (HTTPS) : " GIT_URL
read -p "🌐 Nom de domaine ou IP du VPS : " DOMAIN
read -p "🗄️  Nom de la base MariaDB [covinor_regleur] : " DB_NAME
DB_NAME=${DB_NAME:-covinor_regleur}
read -p "👤 Utilisateur MariaDB [covinor] : " DB_USER
DB_USER=${DB_USER:-covinor}
read -sp "🔑 Mot de passe MariaDB : " DB_PASS
echo ""
read -p "👤 Identifiant app [admin] : " APP_USER
APP_USER=${APP_USER:-admin}
read -sp "🔑 Mot de passe app [admin123] : " APP_PASS
APP_PASS=${APP_PASS:-admin123}
echo ""

APP_DIR="/var/www/covinor"
SERVER_DIR="/opt/covinor-server"
BUILD_DIR="/tmp/covinor-build"

# --- 1. Prérequis ---
echo -e "\n${GREEN}[1/8]${NC} Vérification des prérequis..."

if ! command -v apache2 &> /dev/null; then
  echo -e "${YELLOW}  ⚠ Apache2 non trouvé ! Installation...${NC}"
  apt install -y -qq apache2
fi

MYSQL_CMD="mysql"
if command -v mariadb &> /dev/null; then
  MYSQL_CMD="mariadb"
elif ! command -v mysql &> /dev/null; then
  echo -e "${YELLOW}  ⚠ MariaDB non trouvé ! Installation...${NC}"
  apt install -y -qq mariadb-server
  MYSQL_CMD="mariadb"
fi

if ! command -v git &> /dev/null; then
  apt install -y -qq git
fi

if ! command -v screen &> /dev/null; then
  apt install -y -qq screen
fi

echo "  ✓ Apache2 | MariaDB | Git | screen"

# Node.js
if ! command -v node &> /dev/null; then
  echo "  → Installation de Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y -qq nodejs
fi
echo "  ✓ Node $(node -v) | npm $(npm -v)"

# Modules Apache
a2enmod proxy proxy_http rewrite headers 2>/dev/null
systemctl restart apache2

# --- 2. Clone du repo ---
echo -e "${GREEN}[2/8]${NC} Clonage du repo..."
rm -rf ${BUILD_DIR}
git clone ${GIT_URL} ${BUILD_DIR}
echo "  ✓ Repo cloné dans ${BUILD_DIR}"

# --- 3. Build du frontend ---
echo -e "${GREEN}[3/8]${NC} Build du frontend (npm install + build)..."
cd ${BUILD_DIR}
npm install --legacy-peer-deps
npm run build
echo "  ✓ Frontend compilé"

# --- 4. MariaDB ---
echo -e "${GREEN}[4/8]${NC} Configuration MariaDB..."

APP_PASS_HASH=$(echo -n "$APP_PASS" | sha256sum | awk '{print $1}')

$MYSQL_CMD -u root <<EOF
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

CREATE TABLE IF NOT EXISTS app_settings (
  keyname VARCHAR(100) NOT NULL PRIMARY KEY,
  val VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF

echo "  ✓ Base '${DB_NAME}' prête, utilisateur '${APP_USER}' créé"

# --- 5. Backend Node.js ---
echo -e "${GREEN}[5/8]${NC} Installation du backend..."
mkdir -p ${SERVER_DIR}
cp -r ${BUILD_DIR}/server/* ${SERVER_DIR}/

cat > ${SERVER_DIR}/.env <<ENVFILE
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=${DB_USER}
MYSQL_PASSWORD=${DB_PASS}
MYSQL_DATABASE=${DB_NAME}
PORT=3001
# Optionnel — clé IA pour extraction automatique des fiches
# LOVABLE_AI_KEY=
ENVFILE

chmod +x ${SERVER_DIR}/start.sh ${SERVER_DIR}/stop.sh 2>/dev/null
cd ${SERVER_DIR} && npm install --production
echo "  ✓ Backend installé dans ${SERVER_DIR}"

# --- 6. Frontend ---
echo -e "${GREEN}[6/8]${NC} Déploiement du frontend..."
mkdir -p ${APP_DIR}
cp -r ${BUILD_DIR}/dist/* ${APP_DIR}/
chown -R www-data:www-data ${APP_DIR}
echo "  ✓ Frontend déployé dans ${APP_DIR}"

# --- 7. Apache2 VirtualHost ---
echo -e "${GREEN}[7/8]${NC} Configuration Apache2..."

cat > /etc/apache2/sites-available/covinor.conf <<APACHE
<VirtualHost *:80>
    ServerName ${DOMAIN}
    DocumentRoot ${APP_DIR}

    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/css application/json application/javascript text/xml
    </IfModule>

    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff)\$">
        Header set Cache-Control "public, max-age=2592000, immutable"
    </LocationMatch>

    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:3001/api/
    ProxyPassReverse /api/ http://127.0.0.1:3001/api/

    LimitRequestBody 52428800

    <Directory ${APP_DIR}>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html\$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</VirtualHost>
APACHE

a2ensite covinor.conf 2>/dev/null
a2dissite 000-default.conf 2>/dev/null

if apache2ctl configtest 2>&1 | grep -q "Syntax OK"; then
  systemctl reload apache2
  echo "  ✓ Apache2 configuré"
else
  echo -e "${YELLOW}  ⚠ Erreur config Apache — vérifiez : apache2ctl configtest${NC}"
fi

# --- 8. Démarrer le backend ---
echo -e "${GREEN}[8/8]${NC} Lancement du backend en screen..."
screen -S covinor-api -X quit 2>/dev/null
screen -dmS covinor-api bash -c "cd ${SERVER_DIR} && export \$(cat .env | xargs) && node server.js"
sleep 1

if screen -list | grep -q "covinor-api"; then
  echo "  ✓ Backend démarré en screen 'covinor-api'"
else
  echo -e "${YELLOW}  ⚠ Échec — lancez : cd ${SERVER_DIR} && ./start.sh${NC}"
fi

# --- SSL ---
if [[ ! "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "\n${GREEN}[Bonus]${NC} SSL Let's Encrypt..."
  if ! command -v certbot &> /dev/null; then
    apt install -y -qq certbot python3-certbot-apache
  fi
  certbot --apache -d ${DOMAIN} --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null || \
    echo -e "${YELLOW}  ⚠ SSL échoué — lancez : sudo certbot --apache -d ${DOMAIN}${NC}"
fi

# --- Nettoyage ---
rm -rf ${BUILD_DIR}

# --- Résumé ---
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ COVINOR installé avec succès !${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 App :       ${GREEN}http://${DOMAIN}${NC}"
echo -e "  📡 API :       ${GREEN}http://${DOMAIN}/api/health${NC}"
echo -e "  👤 Login :     ${GREEN}${APP_USER}${NC}"
echo -e "  🗄️  MariaDB :  ${GREEN}${DB_NAME}${NC}"
echo ""
echo -e "  ${BLUE}Commandes :${NC}"
echo "    screen -r covinor-api          → Logs"
echo "    Ctrl+A puis D                  → Détacher"
echo "    cd ${SERVER_DIR} && ./start.sh → Relancer"
echo "    cd ${SERVER_DIR} && ./stop.sh  → Arrêter"
echo ""
