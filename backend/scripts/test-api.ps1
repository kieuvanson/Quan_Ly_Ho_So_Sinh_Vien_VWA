# scripts/test-api.ps1
# Test toàn bộ API + security features:
#   - HttpOnly Secure Cookie cho refreshToken
#   - Refresh token rotation + reuse detection
#   - Rate limit /login
#   - Audit log
#   - Helmet headers
#
# Yêu cầu: app đang chạy ở $BaseUrl (mặc định http://localhost:8081)
# Chạy: powershell -ExecutionPolicy Bypass -File scripts/test-api.ps1

param(
    [string]$BaseUrl = "http://localhost:8081",
    [string]$Username = "Phamthuylinh",
    [string]$Password = "03102004"
)

$ErrorActionPreference = "Continue"
$global:passCount = 0
$global:failCount = 0

function Write-TestResult {
    param([string]$Name, [bool]$Passed, [string]$Detail = "")
    $tag = if ($Passed) { "[PASS]" } else { "[FAIL]" }
    $color = if ($Passed) { "Green" } else { "Red" }
    Write-Host "$tag $Name" -ForegroundColor $color -NoNewline
    if ($Detail) { Write-Host " :: $Detail" -ForegroundColor Gray }
    if ($Passed) { $global:passCount++ } else { $global:failCount++ }
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$CookieFile = $null
    )
    $req = [System.Net.HttpWebRequest]::Create($Uri)
    $req.Method = $Method
    $req.ContentType = "application/json"
    $req.Accept = "application/json"
    $req.Timeout = 10000
    foreach ($k in $Headers.Keys) { $req.Headers.Add($k, $Headers[$k]) }

    # Cookies: load từ file nếu có
    if ($CookieFile -and (Test-Path $CookieFile)) {
        $ck = Get-Content $CookieFile -Raw
        if ($ck) { $req.Headers.Add("Cookie", $ck) }
    }

    if ($null -ne $Body) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 10 -Compress))
        $req.ContentLength = $bytes.Length
        $stream = $req.GetRequestStream()
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Close()
    }

    try {
        $resp = $req.GetResponse()
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
    }

    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $bodyText = $reader.ReadToEnd()
    $reader.Close()
    $resp.Close()

    # Lưu Set-Cookie ra file để các request sau dùng
    $setCookieHeader = $null
    if ($resp.Headers["Set-Cookie"]) { $setCookieHeader = $resp.Headers["Set-Cookie"] }

    return @{
        StatusCode = [int]$resp.StatusCode
        Body = $bodyText
        SetCookie = $setCookieHeader
    }
}

# ===== BẮT ĐẦU TEST =====
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " Test Suite: $BaseUrl" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

$cookieFile = New-TemporaryFile
$cookieFilePath = $cookieFile.FullName

# Test 1: Login với credential đúng
Write-Host "[Group 1] Authentication + Cookie" -ForegroundColor Yellow
$loginResp = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/login" `
    -Body @{ username = $Username; password = $Password }
Write-TestResult "Login (HTTP 200)" ($loginResp.StatusCode -eq 200) "Status=$($loginResp.StatusCode)"

# Parse cookie
if ($loginResp.SetCookie) {
    $cookieLine = ($loginResp.SetCookie -split "`n")[0]
    $nv = ($cookieLine -split ";")[0]
    $nv | Out-File -FilePath $cookieFilePath -Encoding utf8 -NoNewline
    Write-Host "    Cookie nhận được: $($nv.Substring(0, [Math]::Min(60, $nv.Length)))..." -ForegroundColor Gray
} else {
    Write-Host "    Không nhận được cookie!" -ForegroundColor Red
}

$json = $loginResp.Body | ConvertFrom-Json
$accessToken1 = $json.data.token.accessToken
$refreshTokenInBody = $json.data.token.refreshToken
Write-TestResult "refreshToken ẩn khỏi body" ($refreshTokenInBody -eq $null) "refreshToken=$refreshTokenInBody"
Write-TestResult "accessToken có trong body" ($null -ne $accessToken1) "len=$($accessToken1.Length)"

# Test 2: Helmet headers
$h = [System.Net.HttpWebRequest]::Create("$BaseUrl/api/auth/login")
$h.Method = "GET"
try { $h.GetResponse() } catch { $resp = $_.Exception.Response }
$headers = $resp.Headers
Write-TestResult "Header X-Content-Type-Options: nosniff" ($headers["X-Content-Type-Options"] -eq "nosniff")
Write-TestResult "Header X-Frame-Options: DENY" ($headers["X-Frame-Options"] -eq "DENY")
Write-TestResult "Header Referrer-Policy: no-referrer" ($headers["Referrer-Policy"] -eq "no-referrer")

# Test 3: Login sai password
Write-Host ""
Write-Host "[Group 2] Error handling" -ForegroundColor Yellow
$badLogin = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/login" `
    -Body @{ username = $Username; password = "wrongpassword123" }
Write-TestResult "Sai password → 401" ($badLogin.StatusCode -eq 401) "Status=$($badLogin.StatusCode)"

# Test 4: Validation thiếu field
$missingField = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/login" `
    -Body @{ password = "abc" }
Write-TestResult "Thiếu username → 400" ($missingField.StatusCode -eq 400) "Status=$($missingField.StatusCode)"

# Test 5: Refresh với cookie → token mới
Write-Host ""
Write-Host "[Group 3] Refresh Token Rotation" -ForegroundColor Yellow
$refreshResp1 = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/refresh" -CookieFile $cookieFilePath
Write-TestResult "Refresh #1 với cookie → 200" ($refreshResp1.StatusCode -eq 200) "Status=$($refreshResp1.StatusCode)"

if ($refreshResp1.SetCookie) {
    $newCookieLine = ($refreshResp1.SetCookie -split "`n")[0]
    $nv = ($newCookieLine -split ";")[0]
    $nv | Out-File -FilePath $cookieFilePath -Encoding utf8 -NoNewline
}
$json2 = $refreshResp1.Body | ConvertFrom-Json
$accessToken2 = $json2.data.token.accessToken
Write-TestResult "Access token mới khác token cũ" ($accessToken2 -ne $accessToken1)

# Test 6: REUSE DETECTION - gọi lại refresh với cookie cŨ (đã rotate)
# Lưu cookie cũ trước khi refresh
# (Đã bị ghi đè ở trên — để test reuse, ta phải dùng refreshToken từ response login gốc)
# Lấy lại refreshToken từ response login ban đầu (nếu có) — nhưng ta đã ẩn nó.
# Thay bằng cách: gọi login mới (tạo family mới), lưu cookie1, refresh để tạo cookie2, rồi refresh lại bằng cookie1.
Write-Host ""
Write-Host "[Group 4] Reuse Detection" -ForegroundColor Yellow
$login2 = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/login" `
    -Body @{ username = $Username; password = $Password }
$cookie1 = ($login2.SetCookie -split "`n")[0] -split ";" | Select-Object -First 1
$cookie1 | Out-File -FilePath $cookieFilePath -Encoding utf8 -NoNewline

# Refresh lần 1 (rotate)
$refA = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/refresh" -CookieFile $cookieFilePath
$cookie2 = ($refA.SetCookie -split "`n")[0] -split ";" | Select-Object -First 1
$cookie2 | Out-File -FilePath $cookieFilePath -Encoding utf8 -NoNewline
Write-TestResult "Refresh lần 1 → 200" ($refA.StatusCode -eq 200)

# Giờ quay lại dùng cookie1 (đã rotate = REUSE!)
$cookie1 | Out-File -FilePath $cookieFilePath -Encoding utf8 -NoNewline
$refB = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/refresh" -CookieFile $cookieFilePath
Write-TestResult "REUSE cookie cũ → 401" ($refB.StatusCode -eq 401) "Status=$($refB.StatusCode)"

# Sau khi bị phát hiện reuse, refresh lại bằng cookie hợp lệ cũng phải fail
$refC = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/refresh" -CookieFile $cookieFilePath
Write-TestResult "Refresh sau khi family bị revoke → 401" ($refC.StatusCode -eq 401) "Status=$($refC.StatusCode)"

# Test 7: Logout
Write-Host ""
Write-Host "[Group 5] Logout" -ForegroundColor Yellow
$login3 = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/login" `
    -Body @{ username = $Username; password = $Password }
$ck3 = ($login3.SetCookie -split "`n")[0] -split ";" | Select-Object -First 1
$ck3 | Out-File -FilePath $cookieFilePath -Encoding utf8 -NoNewline
$logoutResp = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/logout" -CookieFile $cookieFilePath
Write-TestResult "Logout → 200" ($logoutResp.StatusCode -eq 200) "Status=$($logoutResp.StatusCode)"

# Refresh sau logout phải fail
$afterLogout = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/refresh" -CookieFile $cookieFilePath
Write-TestResult "Refresh sau logout → 401" ($afterLogout.StatusCode -eq 401) "Status=$($afterLogout.StatusCode)"

# Test 8: Rate limit
Write-Host ""
Write-Host "[Group 6] Rate Limit (5 attempts/phút/IP)" -ForegroundColor Yellow
# Đợi rate limit window từ test trước reset (60s)
# Reset bằng cách dùng IP khác — không khả thi. Test sẽ trigger 429 nếu window chưa reset.
$rateLimitHit = $false
for ($i = 1; $i -le 7; $i++) {
    $r = Invoke-Json -Method POST -Uri "$BaseUrl/api/auth/login" `
        -Body @{ username = $Username; password = "wrongpass$i" }
    if ($r.StatusCode -eq 429) { $rateLimitHit = $true; Write-Host "    Triggered 429 ở attempt $i" -ForegroundColor Gray; break }
}
Write-TestResult "Rate limit 429 xuất hiện" $rateLimitHit

# Tổng kết
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " Total: $($global:passCount) pass / $($global:failCount) fail" -ForegroundColor $(if ($global:failCount -eq 0) { "Green" } else { "Red" })
Write-Host "===========================================================" -ForegroundColor Cyan

Remove-Item $cookieFilePath -ErrorAction SilentlyContinue
exit $global:failCount
