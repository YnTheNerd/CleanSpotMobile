@echo off
echo ========================================
echo   CleanSpot - Correction des Dependances
echo ========================================

echo.
echo 1. Nettoyage du cache npm et node_modules...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
npm cache clean --force

echo.
echo 2. Reinstallation des dependances de base...
npm install

echo.
echo 3. Installation des packages Expo requis...
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

echo.
echo 4. Installation des packages Firebase...
npm install firebase

echo.
echo 5. Installation des packages pour images et localisation...
npm install expo-image-picker expo-image-manipulator expo-location

echo.
echo 6. Installation des packages de navigation...
npm install react-native-gesture-handler react-native-reanimated

echo.
echo ========================================
echo   Installation terminee !
echo ========================================
echo.
echo Pour demarrer l'application :
echo   npx expo start --clear
echo.
pause
