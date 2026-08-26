try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 30 -UseBasicParsing
    Write-Host "STATUS: $($r.StatusCode) SIZE: $($r.Content.Length)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
