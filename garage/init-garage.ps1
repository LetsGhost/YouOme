<#
.SYNOPSIS
    One-time bootstrap for the local dev Garage (S3-compatible storage) node,
    used for avatar/group-image storage - see ./garage.toml.

.DESCRIPTION
    Garage starts up with an empty cluster layout and no S3 access keys, so a
    freshly-started node can't actually store anything yet (uploads fail with
    "403 Forbidden: No such key"). This script, run against the dev stack in
    ../docker-compose.yml:
      1. Starts the `garage` service (if not already running).
      2. Reads the new node's ID.
      3. Assigns it a single-node layout (replication_factor=1 - see
         garage.toml) and applies it.
      4. Creates an S3 API key and a bucket, and grants the key read/write.

    Prints the generated GARAGE_ACCESS_KEY_ID / GARAGE_SECRET_ACCESS_KEY at
    the end - copy those into backend/.env, then restart the backend
    (`npm run dev` picks up .env changes on restart, not automatically).

    Safe to re-run: layout assign/apply are no-ops if already applied, and
    key create / bucket create fail loudly (not silently) if they already
    exist - pass -KeyName/-BucketName below if you hit that and want fresh
    ones.

.PARAMETER BucketName
    Name of the bucket to create. Defaults to "avatars".

.PARAMETER KeyName
    Name of the S3 API key to create. Defaults to "avatars-key".

.EXAMPLE
    ./init-garage.ps1
#>

param(
    [string]$BucketName = "avatars",
    [string]$KeyName = "avatars-key"
)

$ErrorActionPreference = "Stop"

$BackendDir = Split-Path -Parent $PSScriptRoot
Set-Location $BackendDir

Write-Host "==> Starting garage (if not already running)"
docker compose up -d garage
if (-not $?) { throw "docker compose up -d garage failed" }

Write-Host "==> Waiting for garage to become healthy"
$deadline = (Get-Date).AddMinutes(2)
while ($true) {
    $status = docker inspect -f '{{.State.Health.Status}}' youome-garage 2>$null
    if ($status -eq "healthy") { break }
    if ((Get-Date) -gt $deadline) {
        throw "Timed out waiting for youome-garage to become healthy (last status: $status)"
    }
    Start-Sleep -Seconds 2
}

Write-Host "==> Reading node ID"
$nodeIdRaw = docker compose exec -T garage /garage node id -q
if (-not $?) { throw "Failed to read garage node id" }
$nodeId = ($nodeIdRaw -split "@")[0].Trim()
Write-Host "    node id: $nodeId"

Write-Host "==> Assigning single-node layout (capacity is a relative weight, not a hard quota)"
docker compose exec -T garage /garage layout assign -z dc1 -c 1G $nodeId
if (-not $?) { throw "garage layout assign failed" }
docker compose exec -T garage /garage layout apply --version 1
if (-not $?) { throw "garage layout apply failed" }

Write-Host "==> Creating bucket '$BucketName' and API key '$KeyName'"
docker compose exec -T garage /garage bucket create $BucketName
if (-not $?) { throw "garage bucket create failed (already exists? pass -BucketName)" }
docker compose exec -T garage /garage key create $KeyName
if (-not $?) { throw "garage key create failed (already exists? pass -KeyName)" }
docker compose exec -T garage /garage bucket allow --read --write $BucketName --key $KeyName
if (-not $?) { throw "garage bucket allow failed" }

Write-Host ""
Write-Host "==> Done. Add these to backend/.env, then restart your backend dev server:"
docker compose exec -T garage /garage key info $KeyName --show-secret
