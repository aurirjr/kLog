$arquivo = (cat "S:\Dropbox\Gauss\Learn\UFC\TCC\klog\kLog-idea\src\app\versioning.css" -Raw -Encoding utf8);

$versao_atual = 0;

$arquivo | sls -pattern "content: '(.*)'; \/\*XX\*\/" -AllMatches | %{ $_.Matches } | % { $versao_atual = $_.Groups[1].Value }

$versao_atual = ([int]$versao_atual+1);

($arquivo -Replace "content: '.*'; \/\*XX\*\/","content: '$versao_atual'; /*XX*/") | Out-File "S:\Dropbox\Gauss\Learn\UFC\TCC\klog\kLog-idea\src\app\versioning.css" -encoding utf8

Write-Host '---------------------------------------'
Write-Host "Versao atual: $versao_atual"
Write-Host '---------------------------------------'
