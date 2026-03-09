#!/bin/bash
# ==============================================
#  COVINOR Régleur — Arrêt du backend
# ==============================================

SCREEN_NAME="covinor-api"

if screen -list | grep -q "$SCREEN_NAME"; then
  screen -S "$SCREEN_NAME" -X quit
  echo "✅ Backend COVINOR arrêté."
else
  echo "ℹ️  Le backend n'était pas en cours d'exécution."
fi
