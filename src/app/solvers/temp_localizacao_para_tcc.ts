import {Graph} from "../entidades/Graph";
import {Node} from "../entidades/Node";
import {Edge} from "../entidades/Edge";
import {Problema} from "../Problema";
import {A} from "../app.component";

export class Solver_Localizacao
{
  public get_X_Y_CT(origens:Array<Node>, X:number, Y:number) : number {
    let CT : number = 0;
    for(let node of origens) {
      CT += node.cog_rate * node.cog_vol * Math.pow(Math.floor(
        Math.pow(node.dist_x.n_m - X, 2) + Math.pow(node.dist_y.n_m - Y, 2)),1/2);
    }
    return Math.floor(CT*100)/100;
  }
  public CT_COG_Otimo(nodes : Array<Node>, power_factor : number,
                      precisao : number, log_onoff : boolean) : number
  {
    power_factor = 1/2;
    let X : number,Y : number;
    let sumVRX : number = 0, sumVRY : number = 0, sumVR : number = 0;
    for(let n of nodes) {
      sumVRX += n.cog_vol * n.cog_rate * n.dist_x.n_m;
      sumVRY += n.cog_vol * n.cog_rate * n.dist_y.n_m;
      sumVR += n.cog_vol * n.cog_rate;
    }
    X = sumVRX / sumVR; Y = sumVRY / sumVR;
    let k : number = 0, valor_anterior : number = 0, valor_atual : number = 0,
      melhoria : number = 0;
    while (true)
    {
      k++; if (k > 200) break;
      valor_atual = this.get_X_Y_CT(nodes, X, Y);
      if (valor_anterior != 0) melhoria = valor_atual / valor_anterior - 1;
      if(log_onoff) A.a.output_line('Custo Total em [ X: '+X+'m ; Y: '+Y
        +'m ] é de : '+ A.a.numberBrFormat.format(valor_atual) +
        ((melhoria>0)?('( '+melhoria * 100+'% )'):''));
      if (valor_anterior != 0 && Math.abs(melhoria) < precisao) break;
      valor_anterior = valor_atual;
      let sumVRX_d : number = 0, sumVRY_d : number = 0, sumVR_d : number = 0;
      let sumVRX : number = 0, sumVRY : number = 0, sumVR : number = 0;
      for(let n of nodes) {
        let d = Math.pow(Math.floor(Math.pow(n.dist_x.n_m - X, 2)
          + Math.pow(n.dist_y.n_m - Y, 2)),1/2);
        sumVRX_d += n.cog_vol * n.cog_rate * n.dist_x.n_m / d;
        sumVRY_d += n.cog_vol * n.cog_rate * n.dist_y.n_m / d;
        sumVR_d += n.cog_vol * n.cog_rate / d;
      }
      X = sumVRX_d / sumVR_d; Y = sumVRY_d / sumVR_d;
    }
    let novo_node = new Node(); novo_node.nome = "CG Otimo";
    novo_node._x_y_m(X,Y);
    A.a._P.p.g.nodes.push(novo_node);
    if(log_onoff)
      A.a.output_line('CG em ['+novo_node.nome+'] com Custo Total de: '+
      A.a.numberBrFormat.format(valor_atual));
    return valor_atual;
  }
  public GUI_avaliar_CT_destino() {
    var nodes_blue : Array<Node> = []; var node_destino : Node;
    for(let node of A.a._P.p.g.nodes) {
      if (node.selected_blue) {
        nodes_blue.push(node);
        if(!(node.cog_rate > 0 && node.cog_vol > 0)) {
          A.a.output_line('Vértice '+node.nome+' não possui Vol/Taxa' +
            ' configurados maiores que zero! Abortado!');
          return;
        }
      }
    }
    for(let node of A.a._P.p.g.nodes) if (node.selected_orange)
    { node_destino = node; break; }
    A.a.output_line('Avaliando custo total(CT) para Vértice ' +
      'específico como CG: ['+node_destino.nome+']');
    let temp = "Origens: ";
    for(let node of nodes_blue) temp+='['+node.nome+'] ';
    A.a.output_line(temp);
    let CT = this.get_X_Y_CT(nodes_blue, node_destino.dist_x.n_m,
      node_destino.dist_y.n_m);
    A.a.output_line('Custo Total: '+A.a.numberBrFormat.format(CT));
  }
  public GUI_calcular_CT_otimo() {
    var nodes_blue : Array<Node> = [];
    A.a.output_line('Calculo CG com Custo Ótimo...');
    for(let node of A.a._P.p.g.nodes) {
      if (node.selected_blue) {
        nodes_blue.push(node);
        if(!(node.cog_rate > 0 && node.cog_vol > 0)) {
          A.a.output_line('Vértice '+node.nome+' não possui Vol/Taxa ' +
            'configurados maiores que zero! Abortado!');
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
