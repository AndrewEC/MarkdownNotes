function Get-SourceDirectory {
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string]$RootDir
    )

    $SourceDir = Join-Path $RootDir src
    if (-not (Test-Path $SourceDir -PathType Container)) {
        throw "Could not find source directory in expected location of [$SourceDir]."
    }
    return $SourceDir
}

function Get-BundleDirectory {
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string]$RootDir
    )

    $BundleDir = Join-Path $RootDir build
    if (Test-Path $BundleDir -PathType Container) {
        Remove-Item $BundleDir -Recurse -Force | Out-Null
    }
    New-Item $BundleDir -ItemType Directory | Out-Null

    return $BundleDir
}

function Get-SourceFiles {
    [OutputType([string[]])]
    param(
        [Parameter(Mandatory)]
        [string]$SourceDir
    )

    return Get-ChildItem $SourceDir -Recurse -File | Where-Object {
        $_.Name -ne "_template.html"
    } | ForEach-Object {
        $_.FullName
    }
}

function Get-TemplateContent {
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string]$SourceDir
    )

    $TemplatePath = Join-Path $SourceDir "_template.html"

    if (-not (Test-Path $TemplatePath -PathType Leaf)) {
        throw "Could not find template in expected location of: [$TemplatePath]."
    }

    Write-Host "Reading content from template file: [$TemplatePath]."
    return Get-MergedContents $TemplatePath
}

function Get-MergedContents {
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string]$FilePath
    )

    $Lines = Get-Content $FilePath
    return $Lines | Join-String -Separator "`r`n"
}

function Invoke-Bundle {
    $SourceDir = Get-SourceDirectory $PSScriptRoot
    Write-Host "Using source directory: [$SourceDir]."

    $BundleDir = Get-BundleDirectory $PSScriptRoot
    Write-Host "Using bundle directory: [$BundleDir]."

    $TemplateContents = Get-TemplateContent $SourceDir
    $SourceFiles = Get-SourceFiles $SourceDir

    foreach ($SourceFile in $SourceFiles) {
        $FileName = Split-Path $SourceFile -Leaf
        $FilePlaceholder = "{{$FileName}}"
        if (-not ($TemplateContents.Contains($FilePlaceholder))) {
            Write-Host "No placeholder of value $FilePlaceholder found in template file. File $FileName will be skipped."
            continue
        }

        Write-Host "Bundling contents of source file: $FileName"
        $FileContents = Get-MergedContents $SourceFile
        $TemplateContents = $TemplateContents.Replace($FilePlaceholder, $FileContents)
    }

    $BundlePath = Join-Path $BundleDir "index.html"
    Set-Content -Path $BundlePath -Value $TemplateContents
    Write-Host "Bundled file written to: [$BundlePath]."
}

Invoke-Bundle
