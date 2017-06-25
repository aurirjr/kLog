import {A} from "../app.component";
import {Node} from "../entidades/Node";
import {Edge} from "../entidades/Edge";

class Economia {
  //Aqui guardo a economia conseguida ao supostamente ligar dois nodes...

  node_a : Node;
  node_b : Node;
  economia : number;

}

export class Solver_VRP
{

  //ISSO È MANTIDO FORA PARA PERMITIR A FUNCIONALIDADE DE PASSO A PASSO
  _passo_a_passo : boolean = false; //Default é false, mas usuario pode mudar...
  get passo_a_passo():boolean {
    return this._passo_a_passo;
  }
  set passo_a_passo(x : boolean) {
    this._passo_a_passo = x;
    //Ao ligar ou desligar o passo a passo, resetar todas as variaveis do problema
    this.nodes_destino = [];
    this.node_origem = null;
    this.economias = [];
    this.passo_a_passo_temp_k = 0;
    this.distancias_total_rotas = [];
  }

  //Isso que contro o passo_a_passo... Ele é o indice da savings, da economias... Quando ele for maior, nao tem mais passo nenhum...
  passo_a_passo_temp_k = 0;

  //Destinos
  nodes_destino : Array<Node> = [];
  //Origem
  node_origem : Node = null;
  //Lista de savings
  economias : Array<Economia> = [];
  //Distancias de cada rota
  distancias_total_rotas : Array<number> = [];

  //Resolvendo roteirização pelo método da economia
  solver_vrp_savings() {

    //É preciso ter pelo menos 1 node selecionado somente de azul e um de vermelho.
    for(let node of A.a._P.p.g.nodes) {

      //Se ele estiver de laranja, então é o node de origem... Se estiver somente azul, é de destino...

      if (node.selected_orange) {

        if(this.node_origem == null) { this.node_origem = node; }
        else {
          //Se encontrou outro laranja, então não pode ter mais de um...
          A.a.output_line('Selecione somente UM vértice de origem (Vermelho)! Abortado!');
        }

      } else if (node.selected_blue) {

        //Checando se é valido... EDIT: NAO PRECISA. Se for zero, simplesmente nao considerar a restrição de volumes...
        //Da mesma forma que o caminhão pode não ter restrição de capacidade ou distancia... Formando uma grande rota so...
        /*if(!(node.cog_vol > 0)) {
          A.a.output_line('Vértice '+node.nome+' não possui Volume configurado maior que zero! Abortado!');
          return;
        }*/

        this.nodes_destino.push(node);
      }
    }

    if(this.node_origem == null) A.a.output_line('Selecione UM vértice de origem (Vermelho)! Abortado!');
    if(this.nodes_destino.length == 0) A.a.output_line('Selecione um ou mais vértices de destino (Azuis)! Abortado!');

    //Aqui os nodes de origem e destino estão bem definidios...
    //Vamos agora criar umas marcações nos nodes de destino, representando onde eles estão ligados.
    //Inicialmente, todos os nodes estão ligados com o node de origem!
    var k : number = 0; //Pra indicar as rotas... De inicio, cada node é uma rota, com duas conexões pra origem...
    for(let node of this.nodes_destino) {
      //ESSAS MARCAÇÕES SÃO O CORAÇÃO DO PROBLEMA. Resolver o problema é definir, pra cada node, da onde vem e pra onde vai o caminhão...
      //Os nodes conectados são uma array, com o elemento 0 e 1...
      node['vrp_conectados'] = [ this.node_origem, this.node_origem ];
      //A rota é definida com um indice...
      node['vrp_rota'] = k++;
      //A distancia inicial de cada rota, é 2* a distancia pra origem...
      this.distancias_total_rotas[k] = 2*Math.pow(Math.floor(Math.pow(node.dist_x.n_m - this.node_origem.dist_x.n_m, 2) + Math.pow(node.dist_y.n_m - this.node_origem.dist_y.n_m, 2)),1/2);
    }

    //Agora vamos calcular a lista ordenada de economias (savings) que irá fornecer o loop mestre que vai formar as rotas...

    //Calcular qual a economia em todas as combinações entre os nodes de destino...
    //De 1 a (n-1), testando com 2 a n... Assim da todas as combinações 2 a 2...
    for(let i=0; i < (this.nodes_destino.length-1); i++) {
      for(let j=(i+1); j < this.nodes_destino.length; j++) {
        //Para entender a economia, basta imaginar o custo do node agora, ligado ao node de origem, e o custo depois, quando ligar...
        //Custo atual: d(0,i) + d(i,0) + d(0,j) + d(j,0) Ao conectar, passa a ser: d(0,i) + d(i,j) + d(j,0)
        //A economia então é só subtrair: Economia = d(i,0) + d(0,j) - d(i,j)
        var s : Economia = new Economia();

        s.node_a = this.nodes_destino[i];
        s.node_b = this.nodes_destino[j];

        s.economia =
          Math.pow(Math.floor(Math.pow(s.node_a.dist_x.n_m - this.node_origem.dist_x.n_m, 2) + Math.pow(s.node_a.dist_y.n_m - this.node_origem.dist_y.n_m, 2)),1/2) //Distancia d(i,0)
          + Math.pow(Math.floor(Math.pow(s.node_b.dist_x.n_m - this.node_origem.dist_x.n_m, 2) + Math.pow(s.node_b.dist_y.n_m - this.node_origem.dist_y.n_m, 2)),1/2) //Distancia d(j,0)
          - Math.pow(Math.floor(Math.pow(s.node_a.dist_x.n_m - s.node_b.dist_x.n_m, 2) + Math.pow(s.node_a.dist_y.n_m - s.node_b.dist_y.n_m, 2)),1/2); //Distancia d(i,j)

        this.economias.push(s);
      }
    }

    //De posse das economias, vamos agora ordena-las... SIM, is that simple to sort.... Se inverter esse (-) ele fica ascending... Mas o problema é desceding... No loop, vamos comecar pela maior economia...
    this.economias.sort(function(a, b) { return b.economia - a.economia; });

    //Aqui vai mostrar já o resultado final, ou vai caminhar passo a passo junto ao usuario
    if(!this.passo_a_passo) this.executar_passo_a_passo(); //Aqui o passo a passo vai ate o fim e vai mostrar o resultado final
    else this.conectar_nodes_gui(this.nodes_destino); //Se o passo a passo estiver ligado, deixa o usuario definir... Os nodes vao aparecer da forma inicial, todos ligados a origem

  }

  executar_passo_a_passo() {

    //Se nao tem passo a passo, entao k é logo 0, e vai ate o fim...
    if(!this.passo_a_passo) this.passo_a_passo_temp_k = 0;

    console.log(this.passo_a_passo_temp_k);

    //Dando loop nas economias, da maior pra menor:
    for(var k = this.passo_a_passo_temp_k; k < this.economias.length; k++) {
      //DEBUG: Para analisar as economias em ordem decrescente:
      //console.log(s.economia);

      //Tentando conectar os nodes, se isso for possivel...

      //A primeira restrição, é se os nodes possuem algum link com a origem, que possa ser quebrado... Inicialmente, TODO node possui dois links com a origem, é o pior roteamento total...
      //Passando por esse loop, esses links com a origem vão sendo quebrados para formar as rotas... formando um link entre si... Então, cada node, ao chegar aqui, pode ter dois, um, ou nenhum link com a origem...
      //Se um node não tem nenhum link com a origem, então é porque ele ja foi conectado a outros dois nodes... Ou seja, ele é INTERIOR e já nem pode ser considerado...
      //Em nenhum momento, pelas pesquisas que fiz, um node INTERIOR pode ser conectado a outro, isso pq, UM LINK FEITO NÃO PODE SER DESFEITO. Ou seja, os unicos links que podem ser desfeitos é com a origem...
      //Nesse codigo abaixo, eu procuro, nos dois nodes da tentantiva de economia aqui, qual LINKS, um de cada um dos dois, vou remover para linka-los

      //Outra restrição que vi na literatura, é que não se pode linkar dois nodes que fazem parte da mesma rota... Isso que impede de as economias ficarem se fechando em circulos e esquecerem a origem...
      //Assim, temos:
      if(
        //Restrição de que nenhuma pode ser interior, ou seja, cada node tem pelo menos uma ligacao com a origem...
      ( ((this.economias[k].node_a['vrp_conectados'][0] == this.node_origem)?1:0) + ((this.economias[k].node_a['vrp_conectados'][1] == this.node_origem)?1:0) > 0 )
      && ( ((this.economias[k].node_b['vrp_conectados'][0] == this.node_origem)?1:0) + ((this.economias[k].node_b['vrp_conectados'][1] == this.node_origem)?1:0) > 0 )
      //Restrição de que eles não podem fazer parte da mesma rota:
      && (this.economias[k].node_a['vrp_rota'] != this.economias[k].node_b['vrp_rota'])
      )
      {

        //Agora sim, vamos trocar a conexão com node_origem de cada uma... MAS PERA...
        //Antes de linkar os nodes, é preciso pegar todos os nodes da duas rotas, e analisar se a rota resultante respeita os limites, as restrições, de volume e distancia
        //Se as restricoes de volume e distancia dos veiculos não for respeitada, entao nao fazer esse link....
        if(!this.tentar_linkar_nodes_economia(this.nodes_destino, this.economias[k], this.node_origem)) continue;

        //Se o passo a passo estar linkado, nesse momento vai haver alguma alteração, então guardar o k pro prox passo e para o for...
        if(this.passo_a_passo) {
          this.passo_a_passo_temp_k = k;
          break; //Ao sair do break ele vai conectar os nodes na situação atual...
        }

      }
    }


    //Sair conectando:
    this.conectar_nodes_gui(this.nodes_destino);
  }


  //Essa funcao vai tentar linkar/conectar dois nodes da economia
  //Ela so linka de fato se as restrições de veiculos forem respeitadas...
  tentar_linkar_nodes_economia(nodes_destino : Array<Node>, s : Economia, node_origem : Node) : boolean {

    var node_a_conectado_com_origem = null; //0 ou 1...
    var node_b_conectado_com_origem = null; //0 ou 1...

    //Aqui to definindo so de onde tiro a origem... Afinal, tenho que escolher...
    if(s.node_a['vrp_conectados'][0] == node_origem) node_a_conectado_com_origem = 0;
    else if(s.node_a['vrp_conectados'][1] == node_origem) node_a_conectado_com_origem = 1;
    if(s.node_b['vrp_conectados'][0] == node_origem) node_b_conectado_com_origem = 0;
    else if(s.node_b['vrp_conectados'][1] == node_origem) node_b_conectado_com_origem = 1;

    //LINKANDO
    if( node_b_conectado_com_origem != null && node_a_conectado_com_origem != null)
    {
      //Tirando as conexões com as origens, e conectando um com o outro...
      s.node_a['vrp_conectados'][node_a_conectado_com_origem] = s.node_b;
      s.node_b['vrp_conectados'][node_b_conectado_com_origem] = s.node_a;

      //@@@@@@@@@@ CALCULANDO SE FURA AS RESTRICOES, se furar, reconectar com a origem

      //ToDo: POR ENQUANTO DESLIGADO, TA BUGADO!
      if(1>2) {

        //Calculando o volume final da rota
        var novo_volume_total_rota : number = 0;
        for(let node of nodes_destino) {
          if(node['vrp_rota'] == s.node_a['vrp_rota'] || node['vrp_rota'] == s.node_b['vrp_rota']) {
            //Esse node faz parte da nova rota possivelmente formada, entao considerar o volume dele:
            novo_volume_total_rota += node.cog_vol;
          }
        }

        //Claculando o custo da rota final... É o custo das rotas antigas somados, subtraindo o das economias...
        var nova_distancia_total_rota : number;
        nova_distancia_total_rota = this.distancias_total_rotas[s.node_a['vrp_rota']] + this.distancias_total_rotas[s.node_b['vrp_rota']] - s.economia;

        //Checando todos os nodes das duas rotas pra ver se o volume dar menor que o do caminhão...
        //Checando todos os caminhos da rota pra ver se a distancia da menor que a que o caminhão pode usar...
        if(
          //Se o usuario definiu uma distancia maxima, checar
        (A.a._P.p.vrp_dist_max_rota.n_m > 0 && nova_distancia_total_rota > A.a._P.p.vrp_dist_max_rota.n_m)
        //Se o usuario definio um volume maximo, checar
        || (A.a._P.p.vrp_vol_max_rota > 0 && novo_volume_total_rota > A.a._P.p.vrp_vol_max_rota)
        ) {
          //FUROU AS RESTRICOES:
          //Voltando para as origens...
          s.node_a['vrp_conectados'][node_a_conectado_com_origem] = node_origem;
          s.node_b['vrp_conectados'][node_b_conectado_com_origem] = node_origem;
          return false;
        }

      }

      //@@@@@@@@@@@


      //Fundindo os indices das rotas:
      this.fundir_rotas(nodes_destino, s.node_a['vrp_rota'], s.node_b['vrp_rota'], nova_distancia_total_rota);

      //Retornando sucesso na linkagem
      return true;
    }

    //Se nao foi linkado, retorna false...
    return false;

  }

  //Essa função vai fundir duas rotas...
  fundir_rotas(nodes_destino : Array<Node>, k_rota_a, k_rota_b, nova_distancia_total_rota : number) {
    //As rotas são representadas por um inteiro k, em cada node, como uma marcação... Que se encontra em node['vrp_rota']
    //Ao se iniciar o problema das economias, havendo 20 nodes, ha 20 rotas ( exatamente origem destino )...
    //Quando dois nodes se likam, essas rotas se juntam... É nesse momento que escolho o MENOR indice para nomear a rota inteira! Ou seja
    //Se estou linkando um node que tinha mais 4 nodes na rota 15 com um node que tinha mais 3 nodes na rota 18, entao todos os nodes da rota 18 vao ter o k alterado pra 15...
    //No final das contas, todo mundo agora, os 7 nodes, fazem parte da rota 15.

    //Decidindo qual o menor numero
    var rota_manter = Math.min(k_rota_a, k_rota_b);
    var rota_trocar = Math.max(k_rota_a, k_rota_b);

    //Trocando pra de menor indice...
    for(let n of nodes_destino) if(n['vrp_rota'] == rota_trocar) n['vrp_rota'] = rota_manter;

    //Atualizando os custos das rotas... Vem de fora...
    this.distancias_total_rotas[rota_manter] = nova_distancia_total_rota;
  }

  //Aqui ele reconecta todos os nodes, da forma como foi definido as rotas...
  conectar_nodes_gui(nodes_destino : Array<Node>) {

    //Antes de conectar, removendo todo e qualquer edge conectado aos nodes em questao...
    //Faco isso pra facilitar aqui, e tambem pra permitir o problema passo a passo...
    for(let e of A.a._P.p.g.edges) {
      //ToDo: TA MEIO BUGADO ISSO AKI, PQ N TA REMOVENDO TUDO
      for(let n of nodes_destino) {
        //Removendo esse edge:
        if (e.nA == n || e.nB == n) A.a._P.p.g.edges.splice(A.a._P.p.g.edges.indexOf(e), 1);
      }
    }

    for(let n of nodes_destino) {

      //Colorindo o node_atual
      //n.set_select('selection_orange',true); //Deixa azul mesmo, so os edges laranja... pra destacar a origem...

      //ToDo: ISSO DA PRA COLOCAR NO MESMO ESTILO 0,1 LA DE CIMA, E NAO NO ANTIGO i, j

      //Criando edge e colorindo
      //Pressuponho false...
      var encontrado_edge_i = false;
      var encontrado_edge_j = false;
      //Procurando nos edges...
      for(var e of A.a._P.p.g.edges) {
        //Checando em relacao ao n com o temp_i
        if((e.nA == n && e.nB == n['vrp_conectados'][0]) || (e.nA == n['vrp_conectados'][0] && e.nB == n)) {
          //Encontrado node, entao destacar com orange:
          e.set_select('selection_orange',true);
          encontrado_edge_i = true;
          if(encontrado_edge_j) break; //Se ja resolveu com o j, parar
        }

        //Checando em relacao ao n com o temp_j
        if((e.nA == n && e.nB == n['vrp_conectados'][1]) || (e.nA == n['vrp_conectados'][1] && e.nB == n)) {
          //Encontrado node, entao destacar com orange:
          e.set_select('selection_orange',true);
          encontrado_edge_j = true;
          if(encontrado_edge_i) break; //Se ja resolveu com o i, parar
        }
      }

      //Se nao encontrou um edge, entao criar e destacar
      if(!encontrado_edge_i) {
        var edge = new Edge()._nA(n)._nB(n['vrp_conectados'][0]);
        A.a._P.p.g.edges.push(edge);
        edge.set_select('selection_orange',true);
      }
      if(!encontrado_edge_j) {
        var edge = new Edge()._nA(n)._nB(n['vrp_conectados'][1]);
        A.a._P.p.g.edges.push(edge);
        edge.set_select('selection_orange',true);
      }

    }

  }

  /*gui_destacar_rota_criando_edges(rota : Array<Node>) {

    var nodes_para_destacar : Array<Node> = nodes_destino.slice(); //Duplicando
    while(true) {

      //Procurando um node qualquer ligado a origem:
      let node_atual : Node = null;
      for(let n of nodes_para_destacar) if(n['vrp_conectados'][1] == node_origem || n['vrp_conectados'][0] == node_origem) { node_atual = n; break; }

      //Se nao achou nenhum mais ligado a origem, parar o while(true)
      if(node_atual == null) break;

      //Se achou, sair percorrendo esse node, ate o fim da rota, que é quando achar outro node na origem...
      //A medida que for criando os edges e destacando o caminho, ir removendo esse node de nodes_para_destacar...
      while(true) {

        //Colorindo o node_atual
        node_atual.set_select('selection_orange',true);

        //Criando edge e colorindo
        //Pressuponho false...
        var encontrado_edge_i = false;
        var encontrado_edge_j = false;
        //Procurando nos edges...
        for(var e of A.a._P.p.g.edges) {
          //Checando em relacao ao node_atual com o temp_i
          if((e.nA == node_atual && e.nB == node_atual['vrp_conectados'][0]) || (e.nA == node_atual['vrp_conectados'][0] && e.nB == node_atual)) {
            //Encontrado node, entao destacar com orange:
            e.set_select('selection_orange',true);
            encontrado_edge_i = true;
            if(encontrado_edge_j) break; //Se ja resolveu com o j, parar
          }

          //Checando em relacao ao node_atual com o temp_j
          if((e.nA == node_atual && e.nB == node_atual['vrp_conectados'][1]) || (e.nA == node_atual['vrp_conectados'][1] && e.nB == node_atual)) {
            //Encontrado node, entao destacar com orange:
            e.set_select('selection_orange',true);
            encontrado_edge_j = true;
            if(encontrado_edge_i) break; //Se ja resolveu com o i, parar
          }
        }

        //Se nao encontrou um edge, entao criar e destacar
        if(!encontrado_edge_i) {
          var edge = new Edge()._nA(node_atual)._nB(node_atual['vrp_conectados'][0]);
          A.a._P.p.g.edges.push(edge);
          edge.set_select('selection_orange',true);
        }
        if(!encontrado_edge_j) {
          var edge = new Edge()._nA(node_atual)._nB(node_atual['vrp_conectados'][1]);
          A.a._P.p.g.edges.push(edge);
          edge.set_select('selection_orange',true);
        }

      }
    }

  }*/

  avaliar_distancia_total_arestas_laranjas() {

    let distancia_total : number = 0;

    //Avaliando o custo toal das arestas selecionadas de laranja:
    for(let edge of A.a._P.p.g.edges) {
      if (edge.selected_orange) {
        distancia_total += Math.pow(Math.floor(Math.pow(edge.nA.dist_x.n_m - edge.nB.dist_x.n_m, 2) + Math.pow(edge.nA.dist_y.n_m - edge.nB.dist_y.n_m, 2)),1/2);
      }
    }

    A.a.output_line('Distancia total das arestas laranjas: '+Math.floor(distancia_total*100)/100+'m');

  }

  //VARREDURA
  //ToDo: Nao vou me preocupar com restricoes agora, pq ta BUGADO
  solver_vrp_varredura() {

    //Definindo a angulacao de todos os nodes:
    //É preciso ter pelo menos 1 node selecionado somente de azul e um de vermelho.
    for(let node of A.a._P.p.g.nodes) {

      //Se ele estiver de laranja, então é o node de origem... Se estiver somente azul, é de destino...

      if (node.selected_orange) {

        if(this.node_origem == null) { this.node_origem = node; }
        else {
          //Se encontrou outro laranja, então não pode ter mais de um...
          A.a.output_line('Selecione somente UM vértice de origem (Vermelho)! Abortado!');
        }

      } else if (node.selected_blue) {

        //Checando se é valido... EDIT: NAO PRECISA. Se for zero, simplesmente nao considerar a restrição de volumes...
        //Da mesma forma que o caminhão pode não ter restrição de capacidade ou distancia... Formando uma grande rota so...
        /*if(!(node.cog_vol > 0)) {
         A.a.output_line('Vértice '+node.nome+' não possui Volume configurado maior que zero! Abortado!');
         return;
         }*/

        this.nodes_destino.push(node);
      }
    }

    if(this.node_origem == null) A.a.output_line('Selecione UM vértice de origem (Vermelho)! Abortado!');
    if(this.nodes_destino.length == 0) A.a.output_line('Selecione um ou mais vértices de destino (Azuis)! Abortado!');

    //Criar uma ORDENACAO e sair conectando os nodes
    for(let node of this.nodes_destino) {
      //A ORDENACAO depende do angulo de cada node feito com a horizontal (atan2), em relação a reta feita com a origem...
      //TESTEI E ISSO TA FUNCIONANDO DE BOA!! SO QUE TA SENDO UMA VARREDURA QUE COMECA NO SUL, GIRA HORARIO, E CONTINUA NO ZUL
      node['vrp_varredura_angulo'] = Math.atan2(node.dist_x.n_m - this.node_origem.dist_x.n_m, node.dist_y.n_m - this.node_origem.dist_y.n_m);
      node['vrp_conectados'] = []; //Iniciando o controle dos nodes conectados a ele, assim como o metodo das economias...
    }
    //De posse dos angulos, posso agora ordenar nodes destino...
    this.nodes_destino.sort(function(a, b) { return b['vrp_varredura_angulo'] - a['vrp_varredura_angulo']; });

    //Realizando a varredura!!!

    //A distancia começa com a do centro ao primeiro node...
    var distancia_acumulada_rota : number = this.DIST(this.nodes_destino[0],this.node_origem);
    var volume_acumulado_rota : number = 0; //Começa 0

    //Ja conecto o primeiro node a origem...
    this.nodes_destino[0]['vrp_conectados'][0] = this.node_origem;

    //ToDo: ESTOU DESCONSIDERANDO AKI NODES QUE, POR SI SO, JA ESTOURAM O LIMITE DE DISTANCIA EM UMA UNICA ROTA, OU VOLUME... SUPONDO TODOS MENORES...

    for(var k = 0; k < this.nodes_destino.length; k++) {
      //DEBUG - Mostrar odenamento de angulos:
      //console.log(this.nodes_destino[k].nome + " Angulo: "+ this.nodes_destino[k]['vrp_varredura_angulo'])

      //Quando for o ultimo, finalizar a rota indo pra origem, nao tem o que fazer:
      if(k==this.nodes_destino.length - 1) {
        this.nodes_destino[k]['vrp_conectados'][1] = this.node_origem;
      }
      // Quaisquer nodes intermediarios:
      else {

        //Quando chega aqui, tem uma distancia e um volume acumulados até esse node...
        //Eu preciso decidir se o node k+1, com o retorno a origem, cabe na rota... Pq se nao couber, eu paro aki, lingadondo com o centro...
        //E ligo o centro ao k+1 para ele continuar, iniciando novamente a distancia_acumulada...
        if(
          //Restricoes de distancia:
          ((A.a._P.p.vrp_dist_max_rota.n_m == 0) || (distancia_acumulada_rota + this.DIST(this.nodes_destino[k],this.nodes_destino[k+1]) + this.DIST(this.nodes_destino[k+1],this.node_origem) <= A.a._P.p.vrp_dist_max_rota.n_m))
          //Restricoes de volumes
          && ((A.a._P.p.vrp_vol_max_rota == 0) || (volume_acumulado_rota + this.nodes_destino[k].cog_vol + this.nodes_destino[k+1].cog_vol <= A.a._P.p.vrp_vol_max_rota ))
        ) {
          //Nesse caso, pode alterar a distancia acumulada até o proximo, e ir pro proximo
          distancia_acumulada_rota += this.DIST(this.nodes_destino[k],this.nodes_destino[k+1]);

          //Adicionando esse volume pra ser considerado no proximo:
          volume_acumulado_rota += this.nodes_destino[k].cog_vol;

          //Esse vai para o k+1
          this.nodes_destino[k]['vrp_conectados'][1] = this.nodes_destino[k+1];
          //O k+1 vem desse...
          this.nodes_destino[k+1]['vrp_conectados'][0] = this.nodes_destino[k];
        } else {
          //Nesse caso, a distancia acumulada vai ser do centro pro proximo, pq esse aqui ja deu, vai pro centro
          distancia_acumulada_rota = this.DIST(this.node_origem,this.nodes_destino[k+1]);
          //Zerando o volume acumulado pro proximo:
          volume_acumulado_rota = 0;

          //Esse vai para a origem...
          this.nodes_destino[k]['vrp_conectados'][1] = this.node_origem;
          //O k+1 vai vir da origem...
          this.nodes_destino[k+1]['vrp_conectados'][0] = this.node_origem;
        }
      }
    }

    //AGORA JA PODE IMPRIMIR:
    this.conectar_nodes_gui(this.nodes_destino);
  }

  public DIST(a : Node, b : Node) : number {
    return Math.pow(Math.floor(Math.pow(a.dist_x.n_m - b.dist_x.n_m, 2) + Math.pow(a.dist_y.n_m - b.dist_y.n_m, 2)),1/2);
  }
}
