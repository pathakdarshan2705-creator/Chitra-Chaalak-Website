# heartbeat-windows.ps1
# Pings the Cloudflare Worker every time this script runs (scheduled via Task Scheduler, every 2 min).
# Only pings if the screen is NOT locked — LogonUI.exe only runs while Windows shows the lock screen.

$workerUrl   = "https://chitra-chaalak-status.pathakdarshan2705.workers.dev/ping"
$secretToken = "NyvWmSCEijd3Of8pr954kReZnl0BVF1xLPHA7wau"

# Detect lock screen: if LogonUI is running, the machine is locked — skip the ping.
$isLocked = Get-Process -Name "LogonUI" -ErrorAction SilentlyContinue

if ($isLocked) {
    exit
}

try {
    Invoke-RestMethod -Uri $workerUrl -Method Post -Headers @{ "x-secret-token" = $secretToken } | Out-Null
} catch {
    # Fail silently — a missed ping just means the badge shows SOON a bit sooner. No need to alert.
}