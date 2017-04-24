import {A} from "../app.component";
import {Edge} from "./Edge";
import {FG1} from "../funcoes_globais/FuncoesGlobais1";
declare var $: any;

export class Node {

  //Setando a posicao, logica ou de screen, altera-se as variaveis aqui
  //Setei usando builder pattern
  public _x_m(x_m: number): Node
  {
    this.x_m = x_m;
    this.x_s = FG1.get_x_s_from_x_m(x_m);
    return this;
  }
  public _y_m(y_m: number): Node
  {
    this.y_m = y_m;
    this.y_s = FG1.get_y_s_from_y_m(y_m);
    return this;
  }
  public _x_s(x_s: number): Node
  {
    this.x_s = x_s;
    this.x_m = FG1.get_x_m_from_x_s(x_s);
    return this;
  }
  public _y_s(y_s: number): Node
  {
    this.y_s = y_s;
    this.y_m = FG1.get_y_m_from_y_s(y_s);
    return this;
  }


  //----------------------------------- Logica

  public x_m : number; //Posicao em metros, do problema
  public y_m : number; //Posicao em metros, do problema

  //Problema do centro de gravidade
  public cog_vol : number = 0; //Volume, em uma unidade qualquer, do ponto de origem/destino
  public cog_rate : number = 0; //Taxa, em $und_dinheiro/und_volume/und_distancia

  //----------------------------------- GUI

  public x_s : number; //Posicao em px, na tela
  public y_s : number; //Posicao em px, na tela


  //Azul: #add8e6 Laranja: #ffa07a Verde: #90ee90

  static cor_blue_selecao = '#add8e6';
  static cor_green_selecao = '#90ee90';
  static cor_orange_selecao = '#ffa07a';

  //Status selecao
  public selected_blue : boolean = false;
  public selected_orange : boolean = false;

  //Cores aplicadas
  public color1 = "white"; //Cor mais interna
  public color2 = "transparent";
  public color3 = "transparent";

  public mouse_over(e, is_over : boolean) {

    //Masas isso, muda o cursor do node se desejar, usando jQuery...
    if(is_over)
    {
      //$(e.target).css('cursor','pointer');
      this.color3 = Node.cor_green_selecao;
    }
    else
    {
      //$(e.target).css('cursor','default');
      this.color3 = 'transparent';
    }

  }

  public mouse_down(e) {

    //Por algum bug isso teve uma hr que nao tava ok.. Abri o chrome em private e tava ok... E no normal so funcionava com zoom... Que estranho...s
    if(A.a.selected_tool != null) {
      if(A.a.selected_tool.nome_tool == 'selection_blue') {
        this.set_select('selection_blue', !this.selected_blue);
        A.a.recontar_selecao_count();
      }
      else if (A.a.selected_tool.nome_tool == 'selection_orange') {
        this.set_select('selection_orange', !this.selected_orange);
        A.a.recontar_selecao_count();
      }
      else if(A.a.selected_tool.nome_tool == 'link_nodes' ) {
        A.a.link_node_a = this; //Definindo esse como o node A.
        A.a.link_node_x_s_2 = this.x_s;
        A.a.link_node_y_s_2 = this.y_s;
      } else if (A.a.selected_tool.nome_tool == 'move_hand') {
        if(!e.ctrlKey && !e.shiftKey) {
          //Nao dar drag se o usuario estiver usando ctrl ou shift...
          A.a.draggable_element = this;
        }
      }
    } else {
      //Se ta clicando com nenhuma tool selecionada, então selecionar azul... Somente este node! remover selecao de todos os outros...
      A.a.remover_selecoes();
      this.set_select('selection_blue', true);
      A.a.recontar_selecao_count();
    }
  }

  public mouse_up(e) {

    if(A.a.selected_tool != null) {

      //Mouse-up em cima de um node, quando se esta usando link_nodes e tem um link_node_a setado, significa o segundo node
      if(A.a.selected_tool.nome_tool == 'link_nodes' && A.a.link_node_a != null ) {
        //Criar o link:
        A.a.svg_edges.push(new Edge()._nA(A.a.link_node_a)._nB(this));
      }
      else if (A.a.selected_tool.nome_tool == 'move_hand') {
        A.a.draggable_element = null;
      }
    }

  }

  public set_select(select_tool : string, s : boolean) {

    if(select_tool == 'selection_blue') {
      this.selected_blue = s;
    }
    else if(select_tool == 'selection_orange') {
      this.selected_orange = s;
    }

    //Quando tiver uma unica selecao, colocar na color2...
    //Quando tiver duas, colocar a orange na color1, e a blue na color2...
    if(this.selected_blue && !this.selected_orange) this.color1 = Node.cor_blue_selecao;
    if(this.selected_blue) this.color2 = Node.cor_blue_selecao;
    if(this.selected_orange) this.color1 = Node.cor_orange_selecao;
    if(this.selected_orange && !this.selected_blue) this.color2 = Node.cor_orange_selecao;

    if(!this.selected_orange && !this.selected_blue) {
      this.color1 = 'white';
      this.color2 = 'transparent';
    }

  }

  public invert_select(select_tool : string) {
    if(select_tool == 'selection_blue') this.set_select(select_tool, !this.selected_blue);
    else if(select_tool == 'selection_orange') this.set_select(select_tool, !this.selected_orange);
  }
}
