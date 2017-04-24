import {Node} from "./Node";
import {A} from "../app.component";

export class Edge {

  //----------------------------------- Logica

  public nA : Node; //Node A
  public _nA(nA : Node): Edge { this.nA = nA; return this; }
  public nB : Node; //Node B
  public _nB(nB : Node): Edge { this.nB = nB; return this; }
  public directed : boolean; //Se for arco direcional
  public dir_from : Node; //Sentido de origem da direção
  public cost : number; //Busto associado a aresta
  public circuity_factor : number //Definido na GUI em um unico edge ou conjunto de edges (talvez grafo todo)
  public max_speed : number; // Estradas podem ter velocidade maxima (m/s)

  //----------------------------------- GUI

  //Azul: #add8e6 Laranja: #ffa07a Verde: #90ee90

  static cor_blue_selecao = '#add8e6';
  static cor_green_selecao = '#90ee90';
  static cor_orange_selecao = '#ffa07a';

  //Status selecao
  public selected_blue : boolean = false;
  public selected_orange : boolean = false;

  //Cores aplicadas
  //public color1 = "black"; //Cor mais interna
  public color2 = "transparent";
  public color3 = "transparent";

  public mouse_over(e, is_over : boolean) {

    //Masas isso, muda o cursor do node se desejar, usando jQuery...
    if(is_over)
    {
      //$(e.target).css('cursor','pointer');
      this.color2 = Node.cor_green_selecao;
    }
    else
    {
      //$(e.target).css('cursor','default');
      this.set_style();
    }

  }

  public mouse_down(e) {

    //Por algum bug isso teve uma hr que nao tava ok.. Abri o chrome em private e tava ok... E no normal so funcionava com zoom... Que estranho...s
    if(A.a.selected_tool != null) {
      if(A.a.selected_tool.nome_tool == 'selection_blue') {
        this.set_select('selection_blue', !this.selected_blue);
      }
      else if (A.a.selected_tool.nome_tool == 'selection_orange') {
        this.set_select('selection_orange', !this.selected_orange);
      }
    } else {
      //Se ta clicando com nenhuma tool selecionada, então selecionar azul... Somente este node! remover selecao de todos os outros...
      A.a.remover_selecoes();
      this.set_select('selection_blue', true);
    }
  }

  public mouse_up(e) {

    //SEM USO AINDA

    // if(A.a.selected_tool != null) {
    //
    // }

  }

  public set_select(select_tool : string, s : boolean) {

    if(select_tool == 'selection_blue') {
      this.selected_blue = s;
    }
    else if(select_tool == 'selection_orange') {
      this.selected_orange = s;
    }

    this.set_style();

  }

  public invert_select(select_tool : string) {
    if(select_tool == 'selection_blue') this.set_select(select_tool, !this.selected_blue);
    else if(select_tool == 'selection_orange') this.set_select(select_tool, !this.selected_orange);
  }

  set_style() {
    if(this.selected_blue && !this.selected_orange) { this.color2 = Node.cor_blue_selecao;  this.color3 = 'transparent'; }
    else if(this.selected_blue && this.selected_orange) { this.color2 = Node.cor_blue_selecao; this.color3 = Node.cor_orange_selecao; }
    else if(!this.selected_blue && this.selected_orange) { this.color2 = Node.cor_orange_selecao; this.color3 = 'transparent'; }
    else if(!this.selected_orange && !this.selected_blue) { this.color2 = 'transparent'; this.color3 = 'transparent'; }
  }

}
