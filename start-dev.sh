#!/bin/bash
set -e

echo "========================================"
echo "  Platform Insentif Zero Burning"
echo "========================================"

echo "[1/3] Menginstall dependensi (backend + frontend)..."
npm run install:all

echo ""
echo "[2/3] Pastikan backend/.env sudah diisi (DATABASE_URL, JWT_SECRET, MINIO...)."
echo "      Jika belum, silakan edit file backend/.env terlebih dahulu."
echo "      Tekan Enter setelah selesai..."
read -r

echo ""
echo "[3/3] Menjalankan Backend (port 3000) + Frontend (port 5173) secara bersamaan..."
npm run dev