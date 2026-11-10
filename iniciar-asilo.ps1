$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$web = Join-Path $root 'www'
$indexFile = Join-Path $web 'index.html'

if (-not (Test-Path -LiteralPath $indexFile -PathType Leaf)) {
    Write-Host 'Pasta www/index.html nao encontrada.' -ForegroundColor Red
    Read-Host 'Pressione Enter para sair'
    exit 1
}

# Servidor HTTP estatico usando somente .NET/Windows PowerShell (sem Python ou Node).
$listener = $null
$port = 8765
while ($port -le 8790 -and -not $listener) {
    $candidate = $null
    try {
        $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
        $candidate.Start()
        $listener = $candidate
    } catch {
        if ($candidate) { try { $candidate.Stop() } catch {} }
        $port++
    }
}

if (-not $listener) {
    Write-Host 'Nao encontrei uma porta livre entre 8765 e 8790.' -ForegroundColor Red
    Read-Host 'Pressione Enter para sair'
    exit 1
}

$webRoot = [System.IO.Path]::GetFullPath($web)
if (-not $webRoot.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $webRoot += [System.IO.Path]::DirectorySeparatorChar
}

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.webp' = 'image/webp'
    '.ico'  = 'image/x-icon'
    '.txt'  = 'text/plain; charset=utf-8'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.map'  = 'application/json; charset=utf-8'
}

function Send-HttpResponse {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [string]$ContentType,
        [byte[]]$Body,
        [string]$Method
    )

    $header = "HTTP/1.1 $StatusCode $StatusText`r`n" +
              "Content-Type: $ContentType`r`n" +
              "Content-Length: $($Body.Length)`r`n" +
              "Cache-Control: no-cache`r`n" +
              "X-Content-Type-Options: nosniff`r`n" +
              "Connection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($Method -ne 'HEAD' -and $Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
}

$url = "http://127.0.0.1:$port/"
Write-Host ''
Write-Host 'Asilo Joao Kuhl Filho iniciado!' -ForegroundColor Green
Write-Host "Endereco: $url" -ForegroundColor Cyan
Write-Host 'Servidor local sem dependencia de Python ou Node.js.' -ForegroundColor Green
Write-Host 'Mantenha esta janela aberta enquanto utiliza o sistema.'
Write-Host 'Pressione Ctrl+C ou feche esta janela para encerrar.'
Write-Host ''
Start-Process $url

try {
    while ($listener) {
        $client = $null
        try {
            $client = $listener.AcceptTcpClient()
            $client.ReceiveTimeout = 5000
            $client.SendTimeout = 5000
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)

            $requestLine = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }
            $parts = $requestLine.Split(' ')
            if ($parts.Length -lt 2) { continue }
            $method = $parts[0].ToUpperInvariant()
            $target = $parts[1]

            # Consome os cabecalhos da requisicao.
            while ($true) {
                $line = $reader.ReadLine()
                if ($null -eq $line -or $line.Length -eq 0) { break }
            }

            if ($method -ne 'GET' -and $method -ne 'HEAD') {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Metodo nao permitido.')
                Send-HttpResponse -Stream $stream -StatusCode 405 -StatusText 'Method Not Allowed' -ContentType 'text/plain; charset=utf-8' -Body $body -Method $method
                continue
            }

            try {
                $requestUri = [System.Uri]::new("http://127.0.0.1:$port$target")
                $relativePath = [System.Uri]::UnescapeDataString($requestUri.AbsolutePath.TrimStart('/'))
                if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }
                $filePath = [System.IO.Path]::GetFullPath((Join-Path $webRoot $relativePath))
            } catch {
                $filePath = ''
            }

            if (-not $filePath -or -not $filePath.StartsWith($webRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Acesso negado.')
                Send-HttpResponse -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'text/plain; charset=utf-8' -Body $body -Method $method
                continue
            }

            if (Test-Path -LiteralPath $filePath -PathType Container) {
                $filePath = Join-Path $filePath 'index.html'
            }

            if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Arquivo nao encontrado.')
                Send-HttpResponse -Stream $stream -StatusCode 404 -StatusText 'Not Found' -ContentType 'text/plain; charset=utf-8' -Body $body -Method $method
                continue
            }

            $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
            $contentType = $mimeTypes[$extension]
            if (-not $contentType) { $contentType = 'application/octet-stream' }
            $body = [System.IO.File]::ReadAllBytes($filePath)
            Send-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType $contentType -Body $body -Method $method
        } catch {
            # Fecha apenas a requisicao com erro e mantem o servidor disponivel.
        } finally {
            if ($client) { try { $client.Close() } catch {} }
        }
    }
} finally {
    if ($listener) { try { $listener.Stop() } catch {} }
}
