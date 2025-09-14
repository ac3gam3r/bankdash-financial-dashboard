# apply-bankdash-v1.ps1
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\apply-bankdash-v1.ps1

$ErrorActionPreference = "Stop"
Write-Host "==> BankDash cleanup/apply script starting..." -ForegroundColor Cyan

if (-not (Test-Path ".git")) { throw "Run this from the git repo root." }

# --- Helpers: JSON <-> Hashtable (PS5-safe) ---
function ConvertTo-Hashtable {
  param([Parameter(Mandatory=$true)] $InputObject)
  if ($null -eq $InputObject) { return $null }

  if ($InputObject -is [System.Collections.IDictionary]) {
    $ht = @{}
    foreach ($k in $InputObject.Keys) { $ht[$k] = ConvertTo-Hashtable $InputObject[$k] }
    return $ht
  }

  if ($InputObject -is [System.Collections.IEnumerable] -and -not ($InputObject -is [string])) {
    $arr = @()
    foreach ($item in $InputObject) { $arr += ,(ConvertTo-Hashtable $item) }
    return $arr
  }

  if ($InputObject -is [psobject]) {
    $ht = @{}
    foreach ($p in $InputObject.PSObject.Properties) { $ht[$p.Name] = ConvertTo-Hashtable $p.Value }
    return $ht
  }

  return $InputObject
}

function Read-JsonAsHashtable {
  param([Parameter(Mandatory=$true)] [string] $Path)
  $raw = Get-Content $Path -Raw
  $obj = $raw | ConvertFrom-Json
  return ConvertTo-Hashtable $obj
}

# --- Vars
$branchName       = "apply-bankdash-v1-cleanup"
$serverDir        = "server"
$serverSrc        = Join-Path $serverDir "src"
$serverAuth       = Join-Path $serverSrc "auth.ts"
$serverDbDir      = Join-Path $serverSrc "db"
$serverDbIndex    = Join-Path $serverDbDir "index.ts"
$serverIndex      = Join-Path $serverSrc "index.ts"
$rootPkgPath      = "package.json"
$clientDir        = "client"
$rootEnvExample   = ".env.example"
$serverEnvExample = Join-Path $serverDir ".env.example"

# --- Branch handling (robust)
$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Current git branch: $currentBranch"

$branchExists = $false
$LASTEXITCODE = 0
git show-ref --verify --quiet ("refs/heads/{0}" -f $branchName)
if ($LASTEXITCODE -eq 0) { $branchExists = $true }

if ($branchExists) {
  Write-Host "Switching to existing branch: $branchName"
  git checkout $branchName | Out-Null
} else {
  Write-Host "Creating and switching to new branch: $branchName"
  git checkout -b $branchName | Out-Null
}

# --- Remove stray client/ if clearly redundant (no package.json)
if (Test-Path $clientDir) {
  $hasClientPkg = Test-Path (Join-Path $clientDir "package.json")
  if (-not $hasClientPkg) {
    Write-Host "Removing redundant '$clientDir/' (no package.json)." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $clientDir
  } else {
    Write-Host "'$clientDir/' contains a package.json; keeping it."
  }
}

# --- Ensure server db dir exists
if (-not (Test-Path $serverDbDir)) { New-Item -ItemType Directory -Force -Path $serverDbDir | Out-Null }

# --- server/src/db/index.ts
@"
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

function toFsPath(input: string): string {
  return input.startsWith("file:") ? input.slice(5) : input;
}

const raw =
  process.env.SQLITE_DB_PATH ??
  process.env.DATABASE_URL ??
  "file:./data/bankdash.sqlite";

const dbFile = path.resolve(process.cwd(), toFsPath(raw));
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

if (process.env.NODE_ENV !== "test") {
  console.log(`[db] Opening SQLite at: ${dbFile}`);
}

const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });
export { schema };
"@ | Set-Content -NoNewline $serverDbIndex -Encoding UTF8
Write-Host "Wrote $serverDbIndex"

# --- server/src/index.ts: ensure dotenv loads first
if (Test-Path $serverIndex) {
  $content = Get-Content $serverIndex -Raw
  if ($content -notmatch 'import\s+"dotenv/config";') {
    ("import `"dotenv/config`";`r`n" + $content) | Set-Content -NoNewline $serverIndex -Encoding UTF8
    Write-Host "Prepended dotenv/config to $serverIndex"
  } else {
    Write-Host "dotenv/config already present in $serverIndex"
  }
}

# --- server/src/auth.ts
@"
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET: Secret =
  process.env.JWT_SECRET ??
  (() => {
    throw new Error("JWT_SECRET is required (set it in your .env)");
  })();

const DEFAULT_EXPIRES_IN: StringValue = "1h";

export function signToken(
  payload: string | object | Buffer,
  options: SignOptions = {}
): string {
  const envExpires = process.env.JWT_EXPIRES_IN as unknown as StringValue | undefined;
  const expiresIn: number | StringValue | undefined =
    options.expiresIn ?? envExpires ?? DEFAULT_EXPIRES_IN;

  return jwt.sign(payload, JWT_SECRET, { ...options, expiresIn });
}

export function verifyToken<T = unknown>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}

// bcrypt rounds
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(plain, salt);
}
export function hashPasswordSync(plain: string): string {
  const salt = bcrypt.genSaltSync(BCRYPT_ROUNDS);
  return bcrypt.hashSync(plain, salt);
}
export function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
export function comparePasswordSync(plain: string, hashed: string): boolean {
  return bcrypt.compareSync(plain, hashed);
}

// Aliases to match route imports
export const verifyPassword = comparePassword;
export const verifyPasswordSync = comparePasswordSync;

// Express auth middleware
export interface AuthRequest extends Request { user?: any; }
export function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
"@ | Set-Content -NoNewline $serverAuth -Encoding UTF8
Write-Host "Wrote $serverAuth"

# --- Root package.json: read as Hashtable (PS5-safe) and edit scripts
if (-not (Test-Path $rootPkgPath)) { throw "No root package.json found." }
$pkg = Read-JsonAsHashtable -Path $rootPkgPath

if (-not $pkg.ContainsKey('scripts')) { $pkg['scripts'] = @{} }

# Ensure dev uses cross-env on Windows
if (-not $pkg['scripts'].ContainsKey('dev')) {
  $pkg['scripts']['dev'] = 'cross-env NODE_ENV=development vite'
} else {
  $devScript = [string]$pkg['scripts']['dev']
  if ($devScript -match '(^| )NODE_ENV=') {
    $devScript = $devScript -replace 'NODE_ENV=', 'cross-env NODE_ENV='
    if ($devScript -notmatch '^cross-env ') { $devScript = 'cross-env ' + $devScript }
    $pkg['scripts']['dev'] = $devScript
  }
}

# Add helper scripts if server exists
if (Test-Path $serverDir) {
  if (-not $pkg['scripts'].ContainsKey('dev:server')) { $pkg['scripts']['dev:server'] = 'cd server && npm run dev' }
  if (-not $pkg['scripts'].ContainsKey('dev:all'))    { $pkg['scripts']['dev:all']    = 'concurrently -n UI,API -c auto "npm run dev" "npm run dev:server"' }
}

# Write package.json back
($pkg | ConvertTo-Json -Depth 100) | Set-Content -NoNewline $rootPkgPath -Encoding UTF8
Write-Host "Patched $rootPkgPath scripts"

# --- .gitignore
@"
# Node
node_modules/
dist/
.build/
.next/
pnpm-lock.yaml
npm-debug.log*
yarn-error.log*

# Vite
.vite/
*.local

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.*.local

# SQLite data
/server/data/*.sqlite
/server/data/*.db
/server/data/*.sqlite-journal
"@ | Set-Content -NoNewline ".gitignore" -Encoding UTF8
Write-Host "Wrote .gitignore"

# --- Example envs
@"
VITE_API_URL=http://localhost:4000
"@ | Set-Content -NoNewline $rootEnvExample -Encoding UTF8
Write-Host "Wrote $rootEnvExample"

@"
# Required
DATABASE_URL=file:./data/bankdash.sqlite
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=10
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Optional alternative to DATABASE_URL:
# SQLITE_DB_PATH=./data/bankdash.sqlite
"@ | Set-Content -NoNewline $serverEnvExample -Encoding UTF8
Write-Host "Wrote $serverEnvExample"

# --- Dev tools
Write-Host "Installing dev tools (cross-env, concurrently) at root..."
npm pkg set scripts.postinstall="echo postinstall ok" | Out-Null
npm i -D cross-env concurrently | Out-Null

# --- Server deps
Write-Host "Ensuring server auth deps (bcryptjs)..." -ForegroundColor Gray
Push-Location $serverDir
npm i bcryptjs | Out-Null
npm i -D @types/bcryptjs | Out-Null
Pop-Location

# --- Commit & push
git add -A
$changed = (git status --porcelain)
if ([string]::IsNullOrWhiteSpace($changed)) {
  Write-Host "No changes to commit."
} else {
  git commit -m "BankDash: cleanup + Windows-friendly dev + server auth/db fixes" | Out-Null
  Write-Host "Committed changes on $branchName"
}

Write-Host "Pushing $branchName..."
git push -u origin $branchName

Write-Host "==> Done. Branch pushed: $branchName" -ForegroundColor Green
