Set-Location 'S:\Dropbox\Gauss\Learn\UFC\TCC\klog\kLog-idea\'

Write-Host '@@@@ CONTROLE DE VERSAO'

$arquivo = (cat "src\app\versioning.css" -Raw -Encoding utf8);

$versao_atual = 0;

$arquivo | sls -pattern "content: '(.*)'; \/\*XX\*\/" -AllMatches | %{ $_.Matches } | % { $versao_atual = $_.Groups[1].Value }

$versao_atual = ([int]$versao_atual+1);

($arquivo -Replace "content: '.*'; \/\*XX\*\/","content: '$versao_atual'; /*XX*/") | Out-File "src\app\versioning.css" -encoding utf8

Write-Host '---------------------------------------'
Write-Host "Versao atual: $versao_atual"
Write-Host '---------------------------------------'

Write-Host '@@@@ BUILDING'

#Building:

  ng build --prod --aot --output-path=docs --base-href /kLog/

  #Coloco em docs, para poder ir direto pro pages do github
  #Cuidado com kLog, que é case sensitive //Ref: http://stackoverflow.com/questions/6650488/why-are-github-project-document-page-urls-case-sensitive-what-are-the-negative

#EDIT: Voltei a utilizar hash, pois estava tendo problema de cache... Então: --output-hashing none REMOVIDO

Write-Host '@@@@ VCS'

$commsg = (Read-Host -Prompt 'Commit msg:')

git commit -a -m "$commsg"

git push
