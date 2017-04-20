import {Edge} from "./Edge";
import {Node} from "./Node";

export class Graph {

  public edges : Array<Edge>;
  public _edges(edges : Array<Edge>): Graph { this.edges = edges; return this; }
  public nodes : Array<Node>;
  public _nodes(nodes : Array<Node>): Graph { this.nodes = nodes; return this; }

}
