//Dijkstra Conforme apostilas do Anselmo "Pesquisa_Operacional_Aula_16_Otimização em redes_Caminho mínimo e caixeiro viajante"

import {Graph} from "../entidades/Graph";
import {Node} from "../entidades/Node";
import {Path} from "../entidades/Path";
import {Edge} from "../entidades/Edge";
import {FG_arrays} from "../funcoes_globais/Arrays";

class Dijkstra_Rotulo
{
  public node : Node ; //Node que tem esse rotulo
  public _node(node : Node): Dijkstra_Rotulo { this.node = node; return this; }
  public u : number; //Distancia total ate esse rotulo. Pode ser indefinido.
  public pred : Node; //Predecessor.
  public permanente : boolean = false; //Se false é temporario
}

export class Solver_Dijkstra
{

  //Usado por find_best_route_Dijkstra. É um greedy para encontrar todos os nodes do grafo acessiveis por um certo node...
  //Contando que esse acesso nao passe por um node da lista Avoid...
  //Util no Dijkstra para evitar que se passe por varios caminhos inuteis que jamais levariam entre um ponto A e B
  public static reachable_nodes_greedy(g : Graph , nK : Node, Avoid : Array<Node>) : Array<Node>
  {

    //Esse bool quer dizer se ja foi checado, praquele node, os seus vizinhos, e adicionados ao dicionario
    //As keys do dicionario sao os nodes acessiveis. Claro que nunca havera duplicidade pq se ja existe, nao adicionar denovo...
    var nodes_acessiveis : Map<Node, boolean> = new Map<Node, boolean>();

    nodes_acessiveis.set(nK,false); //Remover no final, coloco so pra funcionar o algoritmo

    var tem_node_novo : boolean = true; //Enquanto tiver node novo ainda nao checado, rodar o while

    while(tem_node_novo)
    {
      tem_node_novo = false; //Pressupoe false....

      nodes_acessiveis.forEach((bool,node,map) => {

        if (bool == false)
        {
          map.set(node,true); //Cada node novo é checado seus vizinhos conectados...

          //Filtrando todos os edges conectados ao node atual, em seguida pegando os nodes que se conectam com esse...
          for (let novo of g.edges.filter((e) => {return (e.nA == node || e.nB == node); }).map((e) => { return ((e.nA == node) ? e.nB : e.nA); }))
          {
            if (!nodes_acessiveis.has(novo) && (Avoid == null || !Avoid.includes(novo))) //So é novo se ja nao foi adicionado ao dicionario e não é um node a ser evitado...
            {
              nodes_acessiveis.set(novo, false);
              tem_node_novo = true; //Se tem node novo, rodar novamente...
            }
          }
        }

      });
    }

    nodes_acessiveis.delete(nK); //Removendo o nK, afinal a funcao é pra retornar todos acessiveis por ele, nao ele

    return Array.from(nodes_acessiveis.keys()); //http://stackoverflow.com/questions/35341696/how-to-convert-map-keys-to-array
  }

  //Retorna um PATH, representado por um caminho de Edge
  //Utilizado em ROUTE
    public static find_best_route_Dijkstra(graph: Graph, A: Node , B: Node) : Path
    {
      //Para o Path resultado
      var nodes_resultado = new Array<Node>();
      var edges_resultado = new Array<Edge>();

      //Antes de comecar o Dijkstra, eu preciso considerar somentes todo e qualquer node que:
      //Tem caminho ate A & Tem caminho ate B

      //Para tanto, eu faco um greedy, a partir do node A, e outro, a partir do node B.
      //Com isso, levantot os nodes do grafo que sao acessiveis para A, e depois para B.
      //Faco a uniao desse conjunto, tendo entao os nodes interessantes para o Dijkstra

      //ATENCAAAO!
      //Antes de calcular o reachables do B, ver se o B esta nos reachables do A
      //Esse check é importante, pq se nao tiver, ja pode parar o algortimo.

      //Depois eu pego a interseção, pq isso vai deixar o Dijsktra muito mais rapido, sem necessidade de calcular uma porrada de node...

      //Usando avoid, evito varios pontos sem necessidae... pq faco um greed de todos os pontos a partir de B sem passar por A.
      //E todos os pontos a partir de A sem passar por B. A intereseçao é todos os pontos dos caminhos possiveis entre A e B.

      //EDIT:
      //Pensei que isso me retornaria todos os PATHS, mas estava errado!!
      //http://stackoverflow.com/questions/9535819/find-all-paths-between-two-graph-nodes


      //EDIT: So existe uma situação onde a interseção abaixo nao vai retornar nada erronemanente. É quando tiver um caminho direto entre A e B.
      var unico_edge : Edge = null;

      for(var e of graph.edges) {
        if((e.nA == A && e.nB == B) || (e.nA == B && e.nB == A)) {
          unico_edge = e;
          break;
        }
      }

      if (unico_edge != null)
      {
        nodes_resultado.push(unico_edge.nA);
        nodes_resultado.push(unico_edge.nB);
        edges_resultado.push(unico_edge);
        return (new Path()._nodes(nodes_resultado)._edges(edges_resultado));
      }

      //DEIXEI O AVOID, pois traz uma melhoria minima... vai que a partir de B tem alguns nodes, nao precisa ver pro lado de la ou pro lado de ca...
      var avoid = new Array<Node>();
      avoid.push(A); //COMENTADO
      avoid.push(B);

      var todos_os_nodes_acessiveis_por_A : Array<Node> = Solver_Dijkstra.reachable_nodes_greedy(graph, A, avoid);
      var todos_os_nodes_acessiveis_por_B : Array<Node>  = Solver_Dijkstra.reachable_nodes_greedy(graph, B, avoid); //COMENTADO

      //Se ao interceder nao retornar nenhum node, entao nao existe caminho possivel... //COMENTADO
      var nodes_Problema : Array<Node> = FG_arrays.intersection_destructive(todos_os_nodes_acessiveis_por_A,todos_os_nodes_acessiveis_por_B);
      //A checagem podia ser assim:
      //if (!todos_os_nodes_acessiveis_por_A.Contains(B)) return null; //Deixei a checagem mesmo, que é o mais importante ...

      //Mas deixei assim:
      if (nodes_Problema.length == 0) return null; //Nao existe path possivel...

      //Adicionando manualmente o node A e B, pq os codigos acima nao adicionam A e B...
      nodes_Problema.push(A);
      nodes_Problema.push(B);

      //Transformando os nodes em rotulos de Dijkstra
      var rotulos = new Map<Node,Dijkstra_Rotulo>();

      //Preciso tambem dos edges do problema, para saber todos os nodes vizinhos de outro...
      var edges_Problema : Array<Edge> = graph.edges.filter((e) => {return (nodes_Problema.includes(e.nA) || nodes_Problema.includes(e.nB)); });

      //Criando rotulos para todos os nodes, inclusive B
      for (let n of nodes_Problema) rotulos.set(n, new Dijkstra_Rotulo()._node(n)); //Ja é, por default, pemamnente facil, u null e pred null

      rotulos.get(A).permanente = true;
      rotulos.get(A).u = 0;

      //RODANDO DIJKSTRA:
      var atual : Node = A;

      while(atual != null)
      {
        //DEBUG - Analisar com breakpoint
        //var vizinhos = edges_Problema.Where(e => e.nA == atual || e.nB == atual).Select(e => (e.nA == atual) ? e.nB : e.nA).ToList();

        //Marcando os vizinhos do atual
        for (let vizinho of edges_Problema.filter((e) => {return (e.nA == atual || e.nB == atual); }).map((e) => { return ((e.nA == atual) ? e.nB : e.nA); }))
        {
          //E pra pegar um vizinho somente se ele for node do problema... se nao num tem necessidade...
          if (!nodes_Problema.includes(vizinho)) continue;

          //Somando a distancia do vizinho ao rotulo atual
          var u_candidato = rotulos.get(atual).u + Math.pow(Math.pow(atual.dist_x.n_m- vizinho.dist_x.n_m, 2) + Math.pow(atual.dist_y.n_m - vizinho.dist_y.n_m, 2), 0.5);

          //O u sendo null é minha versao de infinito... se for, qualquer coisa é melhor..
          if (rotulos.get(vizinho).u == null || u_candidato < rotulos.get(vizinho).u)
          {
            rotulos.get(vizinho).u = u_candidato;
            rotulos.get(vizinho).pred = atual;
          }
        }

        //DEBUG - Analisar com breakpoint
        //var nao_permanentes = rotulos.Where(kvp => kvp.Value.permanente == false && kvp.Value.u != null).ToList();

        //Procurando agora o no, temporario, de menor u. Ele vira permanente e passa a ser o atual.
        //No momento que nao houver temporarios, acabar o loop

        atual = null;

        rotulos.forEach((rot,node,map) => {
          if(rot.permanente == false && rot.u != null) { //Nao pode ser infinito, um infinito nunca vai ser o atual... pq os vizinhos sempre tem u...
            if (atual == null) atual = node;
            else
            {
              if (rot.u < rotulos.get(atual).u) atual = node; //Escolhendo o node com menor u
            }
          }
        });

        if (atual != null) rotulos.get(atual).permanente = true; //Tornando o atual permanente!

        //Se passar daqui, entao é pq nao achou nenhum temporario. Assim, vai null para o while, e ele sai...
      }

      //Calculando o PathN resultado.

      //Agora, de traz pra frente, vai montando o PathN...

      var node_final = B; //Vai começar pelo B, o final

      //Agora vai inserir B e pegar o predecessor. Quando o predecessor for o A, parar
      while (true)
      {
        //http://stackoverflow.com/questions/8073673/how-can-i-add-new-array-elements-at-the-beginning-of-an-array-in-javascript
        nodes_resultado.unshift(node_final); //Mantendo a ordem... vai empurrando pra frente os que foram adicionado primeiro
        edges_resultado.unshift(edges_Problema.filter( (e) => { return (e.nA == node_final && e.nB == rotulos.get(node_final).pred) || (e.nB == node_final && e.nA == rotulos.get(node_final).pred) })[0]); //[0], pegando o first...

        if (rotulos.get(node_final).pred == A) break;

        node_final = rotulos.get(node_final).pred;
      }

      nodes_resultado.unshift(A); //Inserir o A manualmente

      return new Path()._nodes(nodes_resultado)._edges(edges_resultado);
    }

  // //Retorna um PATH, representado por um caminho de Edge.
  // //Utilizado em ROUTESEQ
  // //Problema do caxeiro viajante.
  // Path find_best_route(Graph graph, Node A, Node B, List<Node> Stops)
  // {
  //   throw (new NotImplementedException());
  // }
  //
  // void set_cost_using_circuity_factor(Edge edge)
  // {
  //
  // }
  //
  // void set_cost_using_distance(Edge edge)
  // {
  //
  // }

}
