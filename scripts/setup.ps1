Param(
  [switch]$Force
)

Write-Host "[setup] Checking Node.js version..."
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
  Write-Warning "Node.js가 설치되어 있지 않습니다. https://nodejs.org 에서 LTS(20.x) 설치를 권장합니다."
} else {
  Write-Host "[setup] Node version: $nodeVersion"
}

$envFile = Join-Path $PSScriptRoot "..\.env.local"
$example = Join-Path $PSScriptRoot "..\.env.local.example"
if (-not (Test-Path $envFile) -or $Force) {
  if (Test-Path $example) {
    Copy-Item $example $envFile -Force
    Write-Host "[setup] .env.local 이 없어서 예시 파일로 생성했습니다. 값을 채워주세요."
  } else {
    Write-Warning "[setup] .env.local.example 을 찾지 못했습니다. 수동으로 .env.local 을 생성하세요."
  }
}

Write-Host "[setup] Installing dependencies with npm ci..."
npm ci
if ($LASTEXITCODE -ne 0) {
  Write-Error "[setup] npm ci 실패. 네트워크/프록시/권한을 확인하세요."
  exit $LASTEXITCODE
}

Write-Host "[setup] Done. 'npm run dev' 로 개발 서버를 시작하세요."

