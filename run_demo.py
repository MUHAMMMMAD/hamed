#!/usr/bin/env python3
"""
تشغيل سريع لعرض النظام كاملاً على المشروع النموذجي.
    python run_demo.py
يكافئ:  python -m masarat demo
"""
from masarat.cli import main

if __name__ == "__main__":
    raise SystemExit(main(["demo"]))
