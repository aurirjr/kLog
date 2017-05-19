import {Edge} from "../entidades/Edge";
import {Node} from "../entidades/Node";
import {A} from "../app.component";
/**
 * Created by aurir on 18/05/2017.
 */

export class AcoesRapidas {

  public interconectar_nodes_sel_azul() {

    for(var i = A.a._P.p.g.nodes.length; i--;) {
      //Checar todos os nodes selecionados de azul
      if(A.a._P.p.g.nodes[i].selected_blue) {
        //Procurar agora outro node, selecionado de azul, que nao seja esse
        for(var ii = i; ii--;) { //Pesquisar sem pesqusiar o que ja pesquisou antes!!! Essa é a tecnica! ;DD
          //Checar todos os nodes selecionados de azul
          if(A.a._P.p.g.nodes[ii].selected_blue && A.a._P.p.g.nodes[ii] != A.a._P.p.g.nodes[i]) {
            //Pronto, vou verificar se existe algum edge entre esses nodes, se não, vou criar
            let achou_algum = false;
            for(var edge of A.a._P.p.g.edges) {
              if((edge.nA == A.a._P.p.g.nodes[i] && edge.nB == A.a._P.p.g.nodes[ii]) || (edge.nB == A.a._P.p.g.nodes[i] && edge.nA == A.a._P.p.g.nodes[ii])) {
                achou_algum = true;
                break;
              }
            }
            if(!achou_algum) {
              //Se nao achou nenhum, entao adicionar:
              A.a._P.p.g.edges.push(new Edge()._nA(A.a._P.p.g.nodes[i])._nB(A.a._P.p.g.nodes[ii]));
            }
          }
        }
      }
    }
  }

  public conectar_nodes_sel_azul_com_laranja() {

    let node_laranja : Node;

    for(var i = A.a._P.p.g.nodes.length; i--;) {
      //Procurando o unico node laranja que tem
      if(A.a._P.p.g.nodes[i].selected_orange) {
        node_laranja = A.a._P.p.g.nodes[i];
        break;
      }
    }

    //Agora conectando os azuis ao laranja
    for(var i = A.a._P.p.g.nodes.length; i--;) {
      //Checar todos os nodes selecionados de azul
      if(A.a._P.p.g.nodes[i].selected_blue) {
        //Se tentar conectar o node_laranja a si mesmo, a funcao linkar_dois_nodes nao deixa...
        //Se algum link ja existe, ela tambem nao cria...
        Edge.linkar_dois_nodes(A.a._P.p.g.nodes[i],node_laranja);
      }
    }
  }

}
