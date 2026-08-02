# Build a single-file windowed EXE with PyInstaller (run on Windows).
$ErrorActionPreference = "Stop"

python -m pip install --upgrade pywebview pythonnet pyinstaller

python -m PyInstaller --noconfirm --clean ekhub.spec

Write-Host "Built: $PWD\dist\EkHub.exe"
