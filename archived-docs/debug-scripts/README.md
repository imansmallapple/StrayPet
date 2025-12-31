# Debug Scripts

Diagnostic and debugging utilities for troubleshooting system issues.

## Scripts Overview

### System Checks
- **check_exact_route.py** - Verify exact API route configurations
- **check_notifications.py** - Check notification system health
- **check_users.py** - Verify user data and configurations

### Diagnostics
- **diagnose_permission_issue.py** - Diagnose user permission problems
- **notification_debug_guide.py** - Comprehensive notification system debugging guide

### Issue Fixes
- **NOTIFICATION_FIX_COMPLETE.py** - Summary of notification system fixes and resolutions

## Usage

### Check System Status
```bash
# Verify routes
python check_exact_route.py

# Check notifications
python check_notifications.py

# Check user data
python check_users.py
```

### Diagnose Issues
```bash
# Diagnose permission problems
python diagnose_permission_issue.py

# Review notification debugging
python notification_debug_guide.py
```

### Review Fixes
```bash
# See what was fixed in notifications
python NOTIFICATION_FIX_COMPLETE.py
```

## Common Issues & Solutions

### Permission Issues
When users cannot access certain endpoints, run:
```bash
python diagnose_permission_issue.py
```

### Notification Problems
For notification system issues, consult:
- `notification_debug_guide.py` - Step-by-step debugging
- `NOTIFICATION_FIX_COMPLETE.py` - Known fixes

## Requirements

- Django setup with proper environment
- Database access
- API server running (for some checks)

---

*These scripts were created during development and testing phases. Keep for reference when troubleshooting similar issues.*
