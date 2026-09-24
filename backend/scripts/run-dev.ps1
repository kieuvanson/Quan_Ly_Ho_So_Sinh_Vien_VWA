# scripts/run-dev.ps1
# Load biến môi trường từ backend/.env rồi chạy JAR.
# Dùng cho môi trường dev local.

param(
    [int]$Port = 0,
    [string]$EnvFile = "$PSScriptRoot\..\.env"
)

if (-not (Test-Path $EnvFile)) {
    Write-Error "Không tìm thấy file $EnvFile. Hãy copy từ .env.example và điền giá trị thật."
    exit 1
}

# Đọc .env, set biến môi trường (chỉ dòng KEY=VALUE không comment)
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $eq = $line.IndexOf("=")
        $key = $line.Substring(0, $eq).Trim()
        $value = $line.Substring($eq + 1).Trim()
        # Bỏ quote nếu có
        if ($value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "[env] $key = ***" -ForegroundColor DarkGray
    }
}

$jar = "$PSScriptRoot\..\target\vwa-edurecords-0.0.1-SNAPSHOT.jar"
if (-not (Test-Path $jar)) {
    Write-Error "Không tìm thấy JAR: $jar. Hãy build trước: .\mvnw.cmd clean package"
    exit 1
}

# Nếu không truyền -Port thì lấy SERVER_PORT từ .env; mặc định 8081
if ($Port -le 0) {
    if ($env:SERVER_PORT) {
        $Port = [int]$env:SERVER_PORT
    } else {
        $Port = 8081
    }
}

Write-Host "Starting app on port $Port..." -ForegroundColor Green
java -jar $jar --server.port=$Port
