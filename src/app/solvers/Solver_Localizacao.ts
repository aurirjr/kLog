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

  //Pag 437 Ballou
  //Centro de gravidade - Nodes, numero de cgs, power factor
  //Algoritmo proprio baseado em http://www.stellingconsulting.nl/SC_centersofgravity.html
  //Checks de validação devem ser feito na função de GUI, antes de executar essa...
  public CT_COG_Otimo(nodes : Array<Node>, power_factor : number, precisao : number, log_onoff : boolean) : number
  {

    //ToDo: Por enquanto desconsiderando power factor, fica 1/2 mesmo...
    power_factor = 1/2;

    let X : number,Y : number;

    //Somas utilizadas no algoritmo, que calculo de um loop so
    let sumVRX : number = 0, sumVRY : number = 0, sumVR : number = 0;
    for(let n of nodes) {
      sumVRX += n.cog_vol * n.cog_rate * n.dist_x.n_m;
      sumVRY += n.cog_vol * n.cog_rate * n.dist_y.n_m;
      sumVR += n.cog_vol * n.cog_rate;
    }

    //Step 2 - Calculando ponto inicial
    X = sumVRX / sumVR;
    Y = sumVRY / sumVR;

    //Step 3 - Calulando novos X e Y em funcao dos anteriores, em loop, até o CT não mudar mais do que a precisão...
    let k : number = 0, valor_anterior : number = 0, valor_atual : number = 0, melhoria : number = 0;

    //Loop que so para quando a iteração acabar
    while (true)
    {
      k++;
      if (k > 200) break; //Por garantia, coloco esse k no maximo em 200... pra nao ficar infinito em erros...

      //Imprimindo as informacoes e checando se pode parar...
      valor_atual = this.get_X_Y_CT(nodes, X, Y);

      if (valor_anterior != 0) melhoria = valor_atual / valor_anterior - 1;

      if(log_onoff) A.a.output_line('Custo Total em [ X: '+X+'m ; Y: '+Y+'m ] é de : '+A.a.numberBrFormat.format(valor_atual) + ((melhoria>0)?('( '+melhoria * 100+'% )'):''));

      if (valor_anterior != 0 && Math.abs(melhoria) < precisao) break;

      //Se ainda nao atingiu a precisao, vamos agora se preparar pra outra rodada

      valor_anterior = valor_atual;

      //Parecido com a posicição inicial, só que agora tambem considero, para cada ponto, a distancia ao ultimo X Y

      let sumVRX_d : number = 0, sumVRY_d : number = 0, sumVR_d : number = 0;

      let sumVRX : number = 0, sumVRY : number = 0, sumVR : number = 0;
      for(let n of nodes) {
        let d = Math.pow(Math.floor(Math.pow(n.dist_x.n_m - X, 2) + Math.pow(n.dist_y.n_m - Y, 2)),1/2);
        sumVRX_d += n.cog_vol * n.cog_rate * n.dist_x.n_m / d;
        sumVRY_d += n.cog_vol * n.cog_rate * n.dist_y.n_m / d;
        sumVR_d += n.cog_vol * n.cog_rate / d;
      }

      //Novo CG, que sera avaliado no inicio do loop
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

  public GUI_calcular_CT_otimo() {

    var nodes_blue : Array<Node> = [];

    A.a.output_line('Calculo CG com Custo Ótimo...');

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

    this.CT_COG_Otimo(nodes_blue,A.a._P.p.loc_power_factor,A.a._P.p.loc_precisao,true);
  }

}
