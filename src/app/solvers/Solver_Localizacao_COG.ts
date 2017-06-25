/**
 * Created by aurir on 19/05/2017.
 */

import {Graph} from "../entidades/Graph";
import {Node} from "../entidades/Node";
import {Edge} from "../entidades/Edge";
import {Problema} from "../Problema";
import {A} from "../app.component";

export class Solver_Localizacao
{

  //Calculando o custo Total de um ponto X Y qualquer, levando em conta cog e vol de todos os outros
  //Essa funcao é usada em varias outras. Nao tem checagens... As checagens, se necessarias, devem ser feitas antes dessa funcao...
  public get_X_Y_CT(origens:Array<Node>, X:number, Y:number) : number {

    let CT : number = 0;

    //Conforme pagina 437 do Ballou, somando, para cada ponto de origem, Volume*Taxa*Distancia(para o Destino)
    for(let node of origens) {
      //ToDo: Usar ou nao power factor aqui!?!?! No lugar de 1/2, colocar um fator de potencia... Nao confundir com o valor de escala K...
      CT += node.cog_rate * node.cog_vol * Math.pow(Math.floor(Math.pow(node.dist_x.n_m - X, 2) + Math.pow(node.dist_y.n_m - Y, 2)),1/2);
    }

    return Math.floor(CT*100)/100; //Dinheiro, em até duas casas decimais...
  }

  public calcular_COG(nodes : Array<Node>) : Node {

    //Somas utilizadas no algoritmo, que calculo de um loop so
    let sumVRX : number = 0, sumVRY : number = 0, sumVR : number = 0;
    for(let n of nodes) {
      sumVRX += n.cog_vol * n.cog_rate * n.dist_x.n_m;
      sumVRY += n.cog_vol * n.cog_rate * n.dist_y.n_m;
      sumVR += n.cog_vol * n.cog_rate;
    }

    //Retornando o centro de gravidade desses Nodes
    return new Node()._x_y_m(sumVRX / sumVR, sumVRY / sumVR);
  }

  //Pag 437 Ballou
  //Centro de gravidade - Nodes, numero de cgs, power factor
  //Algoritmo proprio baseado em http://www.stellingconsulting.nl/SC_centersofgravity.html
  //Checks de validação devem ser feito na função de GUI, antes de executar essa...
  public COG_Otimo_CENTROIDE(nodes : Array<Node>, power_factor : number, precisao : number, log_onoff : boolean) : number
  {

    //ToDo: Por enquanto desconsiderando power factor, fica 1/2 mesmo...
    //power_factor = 1/2;

    let X : number,Y : number;

    let COG_Inicial = this.calcular_COG(nodes);

    //Step 2 - Calculando ponto inicial
    X = COG_Inicial.dist_x.n_m;
    Y = COG_Inicial.dist_y.n_m;

    //Step 3 - Calulando novos X e Y em funcao dos anteriores, em loop, até o CT não mudar mais do que a precisão...
    let k : number = 0, valor_anterior : number = 0, valor_atual : number = 0, melhoria : number = 0;

    //Loop que so para quando a iteração acabar
    while (true)
    {
      k++;
      if (k > 200) break; //Por garantia, coloco esse k no maximo em 200... pra nao ficar infinito em erros...

      //Imprimindo as informacoes e checando se pode parar...
      console.log(" XXXX: " + X + "YYYY: " + Y);
      valor_atual = this.get_X_Y_CT(nodes, X, Y);

      if (valor_anterior != 0) melhoria = valor_atual / valor_anterior - 1;

      if(log_onoff) A.a.output_line('Custo Total em [ X: '+X+'m ; Y: '+Y+'m ] é de : '+A.a.numberBrFormat.format(valor_atual) + ((melhoria>0)?('( '+melhoria * 100+'% )'):''));

      if (valor_anterior != 0 && Math.abs(melhoria) < precisao) break;

      //Se ainda nao atingiu a precisao, vamos agora se preparar pra outra rodada

      valor_anterior = valor_atual;

      //Parecido com a posicição inicial, só que agora tambem considero, para cada ponto, a distancia ao ultimo X Y

      let sumVRX_d : number = 0, sumVRY_d : number = 0, sumVR_d : number = 0;

      for(let n of nodes) {
        let d = Math.pow(Math.floor(Math.pow(n.dist_x.n_m - X, 2) + Math.pow(n.dist_y.n_m - Y, 2)),1/2);
        sumVRX_d += n.cog_vol * n.cog_rate * n.dist_x.n_m / d;
        sumVRY_d += n.cog_vol * n.cog_rate * n.dist_y.n_m / d;
        sumVR_d += n.cog_vol * n.cog_rate / d;
      }

      //Novo CG, que sera avaliado no inicio do loop
      console.log(" sumVRX_d: " + sumVRX_d + " sumVRY_d: " + sumVRY_d + "sumVR_d: " + sumVR_d);
      X = sumVRX_d / sumVR_d;
      Y = sumVRY_d / sumVR_d;
    }

    //Criando node de resultao //ToDo: Talvez, ao reutilizar essa funcao em outros metodos, fazer da criacao de node de resultado algo configuraval
    let novo_node = new Node();
    novo_node.nome = "CG Otimo";
    novo_node._x_y_m(X,Y);
    A.a._P.p.g.nodes.push(novo_node);

    //Msg final:
    if(log_onoff) A.a.output_line('CG em ['+novo_node.nome+'] com Custo Total de: '+A.a.numberBrFormat.format(valor_atual));

    return valor_atual;
  }

  //FUNCOES CHAMADAS PELA GUI:
  public GUI_avaliar_CT_destino() {

    var nodes_blue : Array<Node> = [];
    var node_destino : Node;

    //Procurando pelos nodes selecionados blue
    //for(let node of A.a._P.p.g.nodes) if (node.selected_blue) nodes_blue.push(node);
    for(let node of A.a._P.p.g.nodes) {
      if (node.selected_blue) {
        nodes_blue.push(node);
        //Checando se é valido...
        if(!(node.cog_rate > 0 && node.cog_vol > 0)) {
          A.a.output_line('Vértice '+node.nome+' não possui Vol/Taxa configurados maiores que zero! Abortado!');
          return;
        }
      }
    }

    //Procurando pelo unico node selecionados orange
    for(let node of A.a._P.p.g.nodes) if (node.selected_orange) { node_destino = node; break; }

    A.a.output_line('Avaliando custo total(CT) para Vértice específico como CG: ['+node_destino.nome+']');
    let temp = "Origens: ";
    for(let node of nodes_blue) temp+='['+node.nome+'] ';
    A.a.output_line(temp);

    let CT = this.get_X_Y_CT(nodes_blue, node_destino.dist_x.n_m, node_destino.dist_y.n_m);

    A.a.output_line('Custo Total: '+A.a.numberBrFormat.format(CT));

  }

  public GUI_calcular_COG() {

    var nodes_blue : Array<Node> = [];

    A.a.output_line('Calculo Centro de Gravidade (COG)...');

    //Procurando pelos nodes selecionados blue
    //for(let node of A.a._P.p.g.nodes) if (node.selected_blue) nodes_blue.push(node);
    for(let node of A.a._P.p.g.nodes) {
      if (node.selected_blue) {
        nodes_blue.push(node);
        //Checando se é valido...
        if(!(node.cog_rate > 0 && node.cog_vol > 0)) {
          A.a.output_line('Vértice '+node.nome+' não possui Vol/Taxa configurados maiores que zero! Abortado!');
          return;
        }
      }
    }

    let temp = "Vértices: ";
    for(let node of nodes_blue) temp+='['+node.nome+'] ';
    A.a.output_line(temp);



    //Criando node de resultao //ToDo: Talvez, ao reutilizar essa funcao em outros metodos, fazer da criacao de node de resultado algo configuraval
    let novo_node = this.calcular_COG(nodes_blue);
    novo_node.nome = "COG";
    A.a._P.p.g.nodes.push(novo_node);

    //Msg final:
    A.a.output_line('COG em ['+novo_node.nome+'] com Custo Total de: '+A.a.numberBrFormat.format(this.get_X_Y_CT(nodes_blue, novo_node.dist_x.n_m, novo_node.dist_y.n_m)));
  }

  public GUI_Centroide() {

    //ToDo: ESSE METODO DA BUGADO! QUANDO TEM 2 OU 3 NODES AS VEZES DA OK AS VEZES NAO!!!

    var nodes_blue : Array<Node> = [];

    A.a.output_line('Calculo CG com Custo Ótimo (Centroide)...');

    //Procurando pelos nodes selecionados blue
    //for(let node of A.a._P.p.g.nodes) if (node.selected_blue) nodes_blue.push(node);
    for(let node of A.a._P.p.g.nodes) {
      if (node.selected_blue) {
        nodes_blue.push(node);
        //Checando se é valido...
        if(!(node.cog_rate > 0 && node.cog_vol > 0)) {
          A.a.output_line('Vértice '+node.nome+' não possui Vol/Taxa configurados maiores que zero! Abortado!');
          return;
        }
      }
    }

    let temp = "Vértices: ";
    for(let node of nodes_blue) temp+='['+node.nome+'] ';
    A.a.output_line(temp);

    this.COG_Otimo_CENTROIDE(nodes_blue,A.a._P.p.loc_power_factor,A.a._P.p.loc_precisao,true);
  }

  //Pelo que eu entendi, basta alocar qual node vai para qual CG...
  //Entao se tem K CGs... então cada node vai ser alocado pra um desses K CGs... Depois de definir quem vai ser agrupado ou não... cria-se um CG no agrupamento...
  //Entao, basicamente, o que se deve fazer é definir os agrupamentos de nodes a serem feitos, e encontra o CG pra cada agrupamento...
  //COMO AGRUPAR? Pelo que entendi do Ballou, voce pega a distancia entre todos os nodes... 2 a 2... Dai vai agrupando eles em um CG entre eles dois...
  //Nesse agrupamento, vc vai formando os grupos... Primeiro agrupa de 1 em 1, depois de 2 em 2 ( os cgs ja agrupados ), etc....
  GUI_multiCOG_clustering() {

    //ToDo: ESSE TA QUASE NO PONTO DE TA MASSA, O PROBLEMA DELE É QUE TA AGRUPANDO DIFERENTE DO LOGWARE... N SEI PQ...
    //ToDo: MAIS VAI PRO TCC MESMO ASSIM!! Dando algumas diferenças por ser HEURISTICA, que pode dar um clustering diferenciado, mas resultados aproximados!!

    var nodes_blue : Array<Node> = [];

    A.a.output_line('Calculo MULTICOG...');

    //Procurando pelos nodes selecionados blue
    //for(let node of A.a._P.p.g.nodes) if (node.selected_blue) nodes_blue.push(node);
    for(let node of A.a._P.p.g.nodes) {
      if (node.selected_blue) {
        nodes_blue.push(node);
        //Checando se é valido...
        if(!(node.cog_rate > 0 && node.cog_vol > 0)) {
          A.a.output_line('Vértice '+node.nome+' não possui Vol/Taxa configurados maiores que zero! Abortado!');
          return;
        }
      }
    }

    let temp = "Vértices: ";
    for(let node of nodes_blue) temp+='['+node.nome+'] ';
    A.a.output_line(temp);

    //Criando agrupamentos somente com UM node dentro...
    let agrupamentos : Array<Temp_MultiCog_CG> = [];
    for(var n of nodes_blue) {
      let agrup : Temp_MultiCog_CG = new Temp_MultiCog_CG();
      agrup.node_cg = n; //Nessa config inicial, o cg do grupo é o node unico
      agrup.nodes_agrupados.push(n); //Somente um node agrupado, de inicio...
      agrupamentos.push(agrup);
    }

    //Ir agrupando até so sobrar K grupos... igual ao numero de centros que se deseja achar...
    while (agrupamentos.length > A.a._P.p.loc_qtd_centros)
    {

      //Combinando os agrupamentos!!
      let distancias: Array<Temp_MultiCog_Distancia> = [];
      for (let i = 0; i < (agrupamentos.length - 1); i++) {
        for (let j = (i + 1); j < agrupamentos.length; j++) {
          let nova_distancia: Temp_MultiCog_Distancia = new Temp_MultiCog_Distancia();
          nova_distancia.agrupamento_A = agrupamentos[i];
          nova_distancia.agrupamento_B = agrupamentos[j];
          nova_distancia.distancia = this.DIST(agrupamentos[i].node_cg, agrupamentos[j].node_cg);
          distancias.push(nova_distancia);
        }
      }

      //Ordenando colocando os de menores distancia em primeiro lugar!!
      distancias.sort(function (a, b) {
        return a.distancia - b.distancia;
      });

      //Agora sair testando, a partir das menores distancias, se pode agrupar, e realizar novos agrupamentos!...
      let novos_agrupamentos: Array<Temp_MultiCog_CG> = [];
      for (let d of distancias) {
        //DEBUG - Ver o sort:
        console.log(d.distancia + ' -------------------- ');

        //CHECAR SE OS AGRUPAMENTOS PODEM SER AGRUPADOS, somente se jan ao tiverem sido:
        if (d.agrupamento_A.ja_reagrupado || d.agrupamento_B.ja_reagrupado) continue; //Se algum ja foi reagrupado, então pular essa tentantiva de reagrupa-los

        //DEBUG:
        let temp : string = 'Agrupado ';
        for(let n of d.agrupamento_A.nodes_agrupados) {
          temp += '['+n.nome+']';
        }
        console.log(temp);
        let tempp : string = 'Agrupado ';
        for(let n of d.agrupamento_B.nodes_agrupados) {
          tempp += '['+n.nome+']';
        }
        console.log(tempp);

        //Se chegou aqui, entao agrupar:
        d.agrupamento_A.ja_reagrupado = true;
        d.agrupamento_B.ja_reagrupado = true;

        let novo_agrup: Temp_MultiCog_CG = new Temp_MultiCog_CG();
        //Juntando os nodes originais em um novo agrupamento
        novo_agrup.nodes_agrupados = d.agrupamento_A.nodes_agrupados.concat(d.agrupamento_B.nodes_agrupados);
        console.log("Se liga: ");
        console.log(novo_agrup.nodes_agrupados);

        //Recalculando um CG para o novo agrupamento
        novo_agrup.node_cg = this.calcular_COG(novo_agrup.nodes_agrupados);

        novos_agrupamentos.push(novo_agrup);
      }

      //É interessante notar que, para um numero IMPAR de nodes, pode ter sobrado algum que não foi agrupado... Ele deve ser levado como um agrupamento isolado mesmo assim
      for (let agrup of agrupamentos) {
        if (agrup.ja_reagrupado == false) {
          novos_agrupamentos.push(agrup);
        }
      }

      //Nessa altura, ja posso ignorar os agrupamentos antigos e considerar somente os novos
      agrupamentos = novos_agrupamentos;

      console.log("!!!!!!!!!!!!!!!!!!!");
    }

    //Ao chegar aqui, ja foram feitos os agrupamentos adequados:
    console.log(agrupamentos);
    for(let agrup of agrupamentos) {
      let temp : string = 'Agrupados ';
      for(let n of agrup.nodes_agrupados) {
        temp += '['+n.nome+']';
      }
      A.a.output_line(temp);
    }

  }

  public DIST(a : Node, b : Node) : number {
    return Math.pow(Math.floor(Math.pow(a.dist_x.n_m - b.dist_x.n_m, 2) + Math.pow(a.dist_y.n_m - b.dist_y.n_m, 2)),1/2);
  }

}

//Sempre que um agrupamento de nodes for feito, entre 2 nodes ou 2 agrupamentos previos, usar esse objeto!
class Temp_MultiCog_CG {
  public node_cg : Node;
  public nodes_agrupados : Array<Node> = [];
  public ja_reagrupado : boolean = false; //Quando isso ficar true, nao pode mais reagrupar isso
}
//Aqui que utilizo para analisar a distancia node a node, ou, agrupamento a agrupamento ( representado pelo cg )
//De inicio, cada Temp_MultiCog_CG contem somente UM node mesmo...
//É esse objeto que recebe SORT, a fim de realizar novos agrupamentos...
class Temp_MultiCog_Distancia {
  public agrupamento_A : Temp_MultiCog_CG;
  public agrupamento_B : Temp_MultiCog_CG;
  public distancia : number;
}
