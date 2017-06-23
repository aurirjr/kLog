

import {Graph} from "../entidades/Graph";
import {Node} from "../entidades/Node";
import {Path} from "../entidades/Path";
import {Edge} from "../entidades/Edge";
import {FG_arrays} from "../funcoes_globais/Arrays";
import {A} from "../app.component";

class Dijkstra_Rotulo
{
  public node : Node ;
  public _node(node : Node): Dijkstra_Rotulo { this.node = node; return this; }
  public u : number;
  public pred : Node;
  public permanente : boolean = false;
}

export class Solver_Dijkstra
{

  public alcancaveis_greedy(g : Graph , nK : Node, Avoid : Array<Node>) : Array<Node>
  {
    var nodes_acessiveis : Map<Node, boolean> = new Map<Node, boolean>();
    nodes_acessiveis.set(nK,false); var tem_node_novo : boolean = true;
    while(tem_node_novo)
    {
      tem_node_novo = false; nodes_acessiveis.forEach((bool,node,map) => {
      if (bool == false)
        { map.set(node,true);
          for (let novo of g.edges.filter((e) => {return (e.nA == node
          || e.nB == node); }).map((e) => { return ((e.nA == node) ? e.nB : e.nA); })) {
            if (!nodes_acessiveis.has(novo) && (Avoid == null || !Avoid.includes(novo)))
              nodes_acessiveis.set(novo, false); tem_node_novo = true; }
        } });
    }
    nodes_acessiveis.delete(nK); return Array.from(nodes_acessiveis.keys());
  }
  public do_melhor_rota_dijkstra(graph: Graph, A: Node , B: Node) : Path
  {
    var nodes_resultado = new Array<Node>(); var edges_resultado = new Array<Edge>();
    var unico_edge : Edge = null;
    for(var e of graph.edges) {
      if((e.nA == A && e.nB == B) || (e.nA == B && e.nB == A)) {
        unico_edge = e; break; }
    }
    if (unico_edge != null)
    {
      nodes_resultado.push(unico_edge.nA); nodes_resultado.push(unico_edge.nB);
      edges_resultado.push(unico_edge);
      return (new Path()._nodes(nodes_resultado)._edges(edges_resultado));
    }
    var avoid = new Array<Node>(); avoid.push(A); avoid.push(B);
    var nodes_acessiveis_por_A:Array<Node>=this.alcancaveis_greedy(graph,A,avoid);
    var nodes_acessiveis_por_B:Array<Node>=this.alcancaveis_greedy(graph,B,avoid);
    var nodes_Problema : Array<Node> = FG_arrays
      .intersection_destructive(nodes_acessiveis_por_A,nodes_acessiveis_por_B);
    if (nodes_Problema.length == 0) return null;
    nodes_Problema.push(A); nodes_Problema.push(B);
    var rotulos = new Map<Node,Dijkstra_Rotulo>();
    var edges_Problema : Array<Edge> = graph.edges.filter((e) => {return (
      nodes_Problema.includes(e.nA) || nodes_Problema.includes(e.nB)); });
    for (let n of nodes_Problema) rotulos.set(n, new Dijkstra_Rotulo()._node(n));
    rotulos.get(A).permanente = true; rotulos.get(A).u = 0;
    var atual : Node = A;
    while(atual != null)
    {
      for (let vizinho of edges_Problema.filter((e) => {return (e.nA == atual
      || e.nB == atual); }).map((e) => { return ((e.nA == atual) ? e.nB : e.nA); }))
      {
        if (!nodes_Problema.includes(vizinho)) continue;
        var u_candidato = rotulos.get(atual).u + Math.pow(Math.pow(atual.dist_x.n_m
        - vizinho.dist_x.n_m, 2)+Math.pow(atual.dist_y.n_m-vizinho.dist_y.n_m,2),0.5);
        if (rotulos.get(vizinho).u == null || u_candidato < rotulos.get(vizinho).u)
        {
          rotulos.get(vizinho).u = u_candidato; rotulos.get(vizinho).pred = atual;
        }
      }
      atual = null; rotulos.forEach((rot,node,map) => {
        if(rot.permanente == false && rot.u != null) { if (atual == null) atual = node;
          else if (rot.u < rotulos.get(atual).u) atual = node; }
      });
      if (atual != null) rotulos.get(atual).permanente = true;
    }
    var node_final = B;
    while (true)
    {
      nodes_resultado.unshift(node_final);
      edges_resultado.unshift(edges_Problema.filter( (e) => {
        return (e.nA == node_final && e.nB == rotulos.get(node_final).pred)
          || (e.nB == node_final && e.nA == rotulos.get(node_final).pred) })[0]);
      if (rotulos.get(node_final).pred == A) break;
      node_final = rotulos.get(node_final).pred;
    }
    nodes_resultado.unshift(A);
    return new Path()._nodes(nodes_resultado)._edges(edges_resultado);
  }



  public GUI_calcular_melhor_rota() {
    var nodeA = null; var nodeB = null;
    for(let node of A.a._P.p.g.nodes) {
      if (node.selected_orange) {
        if(nodeA == null) nodeA = node;
        else { nodeB = node; break; }
      }
    }
    A.a.output_line("Calculando melhor rota de ["+nodeA.nome+"] para ["+nodeB.nome+"]...");
    var caminho_otimo : Path = this.do_melhor_rota_dijkstra(new Graph()
      ._nodes(A.a._P.p.g.nodes)._edges(A.a._P.p.g.edges), nodeA, nodeB);
    if(caminho_otimo != null) {
      A.a.remover_selecoes();
      let resultado_pro_output = 'Melhor rota: ';
      for(let node of caminho_otimo.nodes) {
        resultado_pro_output += '>['+node.nome+']';
        node.set_select('selection_orange', true);
      }
      for(let edge of caminho_otimo.edges) {
        edge.set_select('selection_orange', true);
      }
      A.a.recontar_selecao_count(); A.a.output_line(resultado_pro_output);
    } else A.a.output_line("Não existe caminho possivel!");
  }



















}
