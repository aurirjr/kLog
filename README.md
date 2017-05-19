Obs: Por enquanto, App compatível apenas com Google Chrome, onde foi desenvolvido, já que as nuâncias de cada navegador não foram consideradas ainda, e algumas funções têm comportamento inesperado em Firefox, Edge, etc...

# Campos e validação

Existem diversos parâmetros a serem definidos em campos de texto, slides, etc...

Estes campos exigem validação. Por exemplo, campos de distância exigem um formato como 100m ou 0,1km...
Internamente, 100m e 0,1km possuem o mesmo efeito, sendo dois preenchimentos válidos para um campo de distância.

Campos de tempo funcionam da mesma forma, podendo ser preenchidos, por exemplo, com 60m ou 1h.

# Zoom

O zoom pode ser controlado por um valor nominal, no canto inferior direito da tela, ou pelo wheel do mouse.
A barra verde embaixo do valor nominal do zoom, representa a escala do mapa.
O zoom é uma distancia, portanto aceita qualquer valor de distância.

# Tools

Para selecionar qualquer tool, clicar no seu botão.

Atalho: Quando qualquer tool estiver selecionada, remover a tool atual com Mouse Right-Click.

## Tool adicionar vértice

Adiciona um vértice no mapa.

## Tool adicionar aresta

Interliga quaisquer dois vértice no mapa. Basta clicar no primeiro e arrastar até o segundo.

## Tool texto

Adiciona qualquer texto na tela, que será movimentado junto com ZOOM e PAN.

## Tool seleção azul e vermelho

Existem duas seleções, azul e vermelho, que podem selecionar vértices, arestas e textos.
(Textos somente selecionam azul).

Cada elemento fica visualmente alterado quando está selecionado, seja por azul, vermelho, ou ambas.

Assim, pode-se realizar ações específicas nas seleções.

Ao realizar uma seleção, ela inverte o status de seleção do que foi selecionado!

Isso pode ser util para, por exemplo, selecionar toda uma area com centenas de vértices, excluindo um previamente selecionado.

Segurando CTRL: Aplica a ação somente em vértices. Isso pode ser muito util se combinado com a seleção invertida.

## Tool remover seleções

Remove toda e qualquer seleção.

Atalho: Quando nenhuma tool estiver selecionada, remover toda a seleção com Mouse Right-Click.

## Tool deletar

Remove qualquer tipo de item selecionado de azul.
Requisitada uma confirmação para continuar a ação.

## Tool mover

Move vértices e textos. Não move arestas, pois estas dependem dos vértices.
Basta segurar o elemento e mover livremente.

Se o CTRL se manter pressionado, então não funciona a movimentação de um único elemento.
Serão movidos todos os elementos selecionados de azul!

Se, além do CTRL, o Shift se manter pressionado, será criada uma copia dos elementos que seriam movidos!

# Nenhuma tool selecionada

Quando nenhuma tool esta selecionada, o mouse será utilizado para PAN.

Basta clicar em qualquer ponto qualquer, arrastando-o para o novo local deste ponto qualquer.

Sem nenhuma tool, Mouse Right-Click funciona como atalho para remover seleções.
 
# Google Maps

  Pan e Zoom são integrados.
  Google Maps tem 18 niveis de zoom.
  
  #Tipos de mapa definido no botao HRST
    HYBRID	This map type displays a transparent layer of major streets on satellite images.
    ROADMAP	This map type displays a normal street map.
    SATELLITE	This map type displays satellite images.
    TERRAIN	This map type displays maps with physical features such as terrain and vegetation.

# Salvando na conta do Google

  Agora cada usuario pode salvar, deletar ou abrir problemas, salvos com sua conta do google.
  Alem disso, existe um conjunto de problemas publicos, que qualquer usuario logado tem acesso, e não pode salvar em cima.

#Prancheta

  A prancheta permite analisar, adicionar, editar, excluir... Todos os vertices e arestas...
  Se um vertice estiver selecionado de azul, laranja ou azul/laranja, será indicado na prancheta
