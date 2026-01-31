param(
    [switch]$Open
)

function Get-MinifiedContent {
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string]$Content
    )

    $Lines = $Content -split "`n"

    $MinifiedContent = ""
    foreach ($Line in $Lines) {
        $TrimmedLine = $Line.Trim() + " "
        if (
            -not (
                $TrimmedLine.StartsWith("//") `
                -or $TrimmedLine.StartsWith("/*") `
                -or $TrimmedLine.StartsWith("*")
            )
        )
        {
            $MinifiedContent = $MinifiedContent + $TrimmedLine
        }
    }

    return $MinifiedContent
}

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
    $Contents = ($Lines | Join-String -Separator "`r`n")
    if ($FilePath.Contains("markup") -or $FilePath.Contains("scripts")) {
        return (Get-MinifiedContent $Contents)
    }
    return $Contents
}

function Get-IndexOfAll {
    [OutputType([int])]
    param (
        [string]$String,
        [string]$SearchString
    )
    
    $Indexes = @()

    $Index = $String.IndexOf($SearchString)    
    while ($Index -ne -1) {
        $Indexes += $Index
        $Index = $String.IndexOf($SearchString, $Index + 1)
    }
    
    return ,$Indexes
}

function Get-Placeholders {
    [OutputType([string])]
    param(
        [string]$TemplateContents
    )

    $PlaceholderLength = 2
    $PlaceholderStartIndexes = Get-IndexOfAll $TemplateContents "{{"
    $PlaceholderEndIndexes = Get-IndexOfAll $TemplateContents "}}"

    if ($PlaceholderStartIndexes.Length -ne $PlaceholderEndIndexes.Length) {
        throw "Invalid template file. All {{ tokens must have an associated }} token."
    }

    $Placeholders = @()
    for ($i = 0; $i -lt $PlaceholderStartIndexes.Length; $i++) {
        $Placeholders += $TemplateContents.Substring(
            $PlaceholderStartIndexes[$i],
            $PlaceholderEndIndexes[$i] - $PlaceholderStartIndexes[$i] + $PlaceholderLength
        )
    }
    return ,$Placeholders
}

function Invoke-Bundle {
    [OutputType([string])]
    param()

    $SourceDir = Get-SourceDirectory $PSScriptRoot
    Write-Host "Using source directory: [$SourceDir]."

    $BundleDir = Get-BundleDirectory $PSScriptRoot
    Write-Host "Using bundle directory: [$BundleDir]."

    $TemplateContents = Get-TemplateContent $SourceDir
    $TemplatePlaceholders = Get-Placeholders $TemplateContents
    $UsedTemplatePlaceholders = @()
    $SourceFiles = Get-SourceFiles $SourceDir

    foreach ($SourceFile in $SourceFiles) {
        $FileName = Split-Path $SourceFile -Leaf
        $FilePlaceholder = "{{$FileName}}"
        if (-not ($TemplateContents.Contains($FilePlaceholder))) {
            Write-Host "No placeholder of value [$FilePlaceholder] found in template file. File [$FileName] will be skipped."
            continue
        }
        $UsedTemplatePlaceholders += $FilePlaceholder

        Write-Host "Bundling contents of source file: [$FileName]"
        $FileContents = Get-MergedContents $SourceFile
        $TemplateContents = $TemplateContents.Replace($FilePlaceholder, $FileContents)
    }

    if ($UsedTemplatePlaceholders.Length -ne $TemplatePlaceholders.Length) {
        Write-Host "Warning: The following placeholders exist in the template but were not used:"
        foreach ($Placeholder in $TemplatePlaceholders) {
            if ($UsedTemplatePlaceholders -contains $Placeholder) {
                continue
            }
            Write-Host "    $Placeholder"
        }
    }

    $BundlePath = Join-Path $BundleDir "MarkdownNotes.html"
    Set-Content -Path $BundlePath -Value $TemplateContents
    Write-Host "Bundled file written to: [$BundlePath]."

    return $BundlePath
}

$BundlePath = Invoke-Bundle

if ($Open) {
    Invoke-Item $BundlePath
}
