#!/usr/bin/env python3
"""Test if script runs and prints to stderr"""
import sys

print("STDOUT: Script started", file=sys.stdout)
print("STDERR: Script started", file=sys.stderr)
sys.stdout.flush()
sys.stderr.flush()

try:
    import requests
    print("STDOUT: requests imported OK", file=sys.stdout)
except Exception as e:
    print(f"STDERR: Import error: {e}", file=sys.stderr)
    sys.exit(1)

# This should appear
print("STDOUT: About to make request", file=sys.stdout)
sys.stdout.flush()
