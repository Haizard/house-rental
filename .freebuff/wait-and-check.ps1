Start-Sleep -Seconds 15
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 60 -UseBasicParsing
    Write-Output "STATUS: $($r.StatusCode)"
    Write-Output "LENGTH: $($r.Content.Length)"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
# Get PID
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
    Write-Output "PID: $($conn.OwningProcess)"
} else {
    Write-Output "NO_LISTENER"
}
