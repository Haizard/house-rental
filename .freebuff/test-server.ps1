try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 120 -UseBasicParsing
    Write-Output "STATUS: $($r.StatusCode)"
    Write-Output "LENGTH: $($r.Content.Length)"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
