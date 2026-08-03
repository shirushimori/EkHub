# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec: bundle the pywebview launcher into a single windowed EXE.
import os
from PyInstaller.utils.hooks import collect_all

APP_NAME = "EkHub"

a = Analysis(
    ["ekhub.py"],
    pathex=[os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)

# pywebview on Windows rides on pythonnet (clr) + WebView2 — pull every submodule in.
for pkg in ("webview", "pythonnet", "clr"):
    try:
        datas, binaries, hiddenimports = collect_all(pkg)
        a.datas += datas
        a.binaries += binaries
        a.hiddenimports += hiddenimports
    except Exception:
        pass

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name=APP_NAME,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
