param(
    [string]$OutputDirectory = (Join-Path (Split-Path -Parent $PSScriptRoot) "logs")
)

$ErrorActionPreference = "Stop"
$baseUri = "https://dadosabertos.camara.leg.br/api/v2"
$runStartedAt = Get-Date
$results = [System.Collections.Generic.List[object]]::new()

function New-EndpointUri {
    param(
        [string]$Path,
        [hashtable]$Query
    )

    $uri = "$baseUri/$Path"
    if ($Query.Count -gt 0) {
        $queryString = ($Query.GetEnumerator() | ForEach-Object {
            "{0}={1}" -f [uri]::EscapeDataString([string]$_.Key), [uri]::EscapeDataString([string]$_.Value)
        }) -join "&"
        $uri = "$uri`?$queryString"
    }

    return $uri
}

function Get-ResponseItems {
    param($Payload)

    if ($null -eq $Payload -or $null -eq $Payload.dados) {
        return @()
    }

    if ($Payload.dados -is [System.Array]) {
        return @($Payload.dados)
    }

    return @($Payload.dados)
}

function Add-SkippedEndpoint {
    param(
        [string]$Path,
        [string]$Reason
    )

    $results.Add([pscustomobject]@{
        method = "GET"
        url = "$baseUri/$Path"
        parameters = @{}
        testedAt = (Get-Date).ToString("o")
        httpStatus = $null
        durationMs = $null
        responseFormat = $null
        usefulFields = @()
        pagination = $null
        sampleOfficialId = $null
        backendNormalizationDecision = "Nao definida; endpoint nao foi consultado."
        error = $Reason
        result = "skipped"
    })
}

function Invoke-CamaraEndpoint {
    param(
        [string]$Path,
        [hashtable]$Query = @{},
        [string]$NormalizationDecision = "Preserve source fields and record the URL, query time, and official identifier."
    )

    $uri = New-EndpointUri -Path $Path -Query $Query
    $startedAt = Get-Date
    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    $status = $null
    $payload = $null
    $errorMessage = $null

    try {
        $response = Invoke-WebRequest -Uri $uri -Method Get -Headers @{ Accept = "application/json" } -TimeoutSec 30 -UseBasicParsing
        $status = [int]$response.StatusCode
        $payload = $response.Content | ConvertFrom-Json
    }
    catch {
        $errorMessage = $_.Exception.Message
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $status = [int]$_.Exception.Response.StatusCode
        }
    }
    finally {
        $timer.Stop()
    }

    $rootFields = @()
    $usefulFields = @()
    $items = @()
    $nextPage = $null
    $sampleOfficialId = $null

    if ($null -ne $payload) {
        $rootFields = @($payload.PSObject.Properties.Name)
        $items = @(Get-ResponseItems -Payload $payload)
        if ($items.Count -gt 0 -and $null -ne $items[0]) {
            $usefulFields = @($items[0].PSObject.Properties.Name)
            if ($items[0].PSObject.Properties["id"]) {
                $sampleOfficialId = $items[0].id
            }
        }
        if ($payload.links) {
            $nextLink = @($payload.links | Where-Object { $_.rel -eq "next" } | Select-Object -First 1)
            if ($nextLink.Count -gt 0) {
                $nextPage = $nextLink[0].href
            }
        }
    }

    $entry = [pscustomobject]@{
        method = "GET"
        url = $uri
        parameters = $Query
        testedAt = $startedAt.ToString("o")
        httpStatus = $status
        durationMs = $timer.ElapsedMilliseconds
        responseFormat = if ($null -eq $payload) {
            $null
        } else {
            [pscustomobject]@{
                rootFields = $rootFields
                dataType = if ($null -eq $payload.dados) { $null } elseif ($payload.dados -is [System.Array]) { "array" } else { $payload.dados.GetType().Name }
                dataCount = $items.Count
            }
        }
        usefulFields = $usefulFields
        pagination = [pscustomobject]@{
            nextPage = $nextPage
            links = if ($null -ne $payload -and $payload.links) { @($payload.links) } else { @() }
        }
        sampleOfficialId = $sampleOfficialId
        backendNormalizationDecision = $NormalizationDecision
        error = $errorMessage
        result = if ($null -ne $status -and $status -ge 200 -and $status -lt 300 -and $null -ne $payload) { "success" } else { "error" }
    }

    $results.Add($entry)
    return [pscustomobject]@{
        Entry = $entry
        Payload = $payload
        Items = $items
    }
}

$deputies = Invoke-CamaraEndpoint -Path "deputados" -Query @{ ordem = "ASC"; ordenarPor = "nome"; itens = "10" }
$deputyId = $null
if ($deputies.Items.Count -gt 0) {
    $deputyId = $deputies.Items[0].id
}

if ($null -ne $deputyId) {
    $null = Invoke-CamaraEndpoint -Path "deputados/$deputyId"
    $null = Invoke-CamaraEndpoint -Path "deputados/$deputyId/despesas" -Query @{ itens = "10"; ano = "2025" }
} else {
    Add-SkippedEndpoint -Path "deputados/{id}" -Reason "The list returned no deputy identifier to use."
    Add-SkippedEndpoint -Path "deputados/{id}/despesas" -Reason "The list returned no deputy identifier to use."
}

$proposals = Invoke-CamaraEndpoint -Path "proposicoes" -Query @{ itens = "10"; ano = "2020"; siglaTipo = "PL" }
$proposalId = $null
if ($proposals.Items.Count -gt 0) {
    $proposalId = $proposals.Items[0].id
}

if ($null -ne $proposalId) {
    $null = Invoke-CamaraEndpoint -Path "proposicoes/$proposalId"
    $null = Invoke-CamaraEndpoint -Path "proposicoes/$proposalId/tramitacoes"
    $proposalVotes = Invoke-CamaraEndpoint -Path "proposicoes/$proposalId/votacoes"
    $voteId = $null
    if ($proposalVotes.Items.Count -gt 0 -and $proposalVotes.Items[0].PSObject.Properties["id"]) {
        $voteId = $proposalVotes.Items[0].id
    }

    if ($null -ne $voteId) {
        $null = Invoke-CamaraEndpoint -Path "votacoes/$voteId/votos"
    } else {
        Add-SkippedEndpoint -Path "votacoes/{id}/votos" -Reason "The proposal votes response returned no usable vote identifier."
    }
} else {
    Add-SkippedEndpoint -Path "proposicoes/{id}" -Reason "The list returned no proposal identifier to use."
    Add-SkippedEndpoint -Path "proposicoes/{id}/tramitacoes" -Reason "The list returned no proposal identifier to use."
    Add-SkippedEndpoint -Path "proposicoes/{id}/votacoes" -Reason "The list returned no proposal identifier to use."
    Add-SkippedEndpoint -Path "votacoes/{id}/votos" -Reason "Cannot identify a vote without a proposal and its official vote identifier."
}

if (-not (Test-Path -LiteralPath $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
}

$runFinishedAt = Get-Date
$log = [pscustomobject]@{
    project = "Voz Publica"
    source = "Camara dos Deputados Open Data"
    apiBaseUrl = $baseUri
    runStartedAt = $runStartedAt.ToString("o")
    runFinishedAt = $runFinishedAt.ToString("o")
    durationMs = [long](($runFinishedAt - $runStartedAt).TotalMilliseconds)
    endpoints = @($results)
}

$fileName = "validacao-api-camara-{0}.json" -f $runStartedAt.ToString("yyyyMMdd-HHmmss")
$logPath = Join-Path $OutputDirectory $fileName
$log | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $logPath -Encoding UTF8

$results | Select-Object @{Name = "result"; Expression = { $_.result } }, @{Name = "status"; Expression = { $_.httpStatus } }, @{Name = "endpoint"; Expression = { $_.url } }, @{Name = "ms"; Expression = { $_.durationMs } }, @{Name = "sampleId"; Expression = { $_.sampleOfficialId } } | Format-Table -AutoSize
Write-Output "Log saved to: $logPath"

$failedEndpoints = @($results | Where-Object { $_.result -eq "error" })
if ($failedEndpoints.Count -gt 0) {
    Write-Error "$($failedEndpoints.Count) endpoint request(s) failed. See the JSON log for details."
    exit 1
}
