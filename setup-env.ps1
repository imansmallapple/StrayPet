# StrayPet Development Environment Setup
# Run this script to set up your Python environment without conda activation issues

Write-Host "🐾 Setting up StrayPet development environment..." -ForegroundColor Cyan

# Add conda paths to current session
$env:PATH = "C:\Users\alf13\anaconda3;C:\Users\alf13\anaconda3\Scripts;C:\Users\alf13\anaconda3\Library\bin;" + $env:PATH

# Set Python encoding
$env:PYTHONIOENCODING = "utf-8"

# Verify Python
Write-Host "`n✅ Python version:" -ForegroundColor Green
python --version

Write-Host "`n✅ Pip version:" -ForegroundColor Green
pip --version

Write-Host "`n🎉 Environment ready! You can now run:" -ForegroundColor Green
Write-Host "   - Backend: cd backend; python manage.py runserver" -ForegroundColor Yellow
Write-Host "   - Frontend: cd frontend; pnpm dev" -ForegroundColor Yellow
Write-Host ""
