import {Edge} from "./Edge";
import {Node} from "./Node";
export class Path {

  //Define um path como um conjunto de nodes, ordenados em um dicionario ( a ordem de Keys importa ), onde é guardada tambem referencia para cada edge...
  //Nos edges, ja existem referencias para o seus nodes...

  //Um path é um conjunto de edges ligados uns aos outros

  public edges : Array<Edge>;
  public _edges(edges : Array<Edge>): Path { this.edges = edges; return this; }
  public nodes : Array<Node>;
  public _nodes(nodes : Array<Node>): Path { this.nodes = nodes; return this; }
}
