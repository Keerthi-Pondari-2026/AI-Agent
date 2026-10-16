# Always use the project venv (avoids missing deps on system Python)
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    Write-Host "Creating virtual environment..."
    py -m venv (Join-Path $Root ".venv")
}

& $Python -m pip install -q -r (Join-Path $Root "requirements.txt")
Set-Location $Root
& $Python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
