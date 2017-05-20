import {A} from "../app.component";
import {FG1} from "../funcoes_globais/FuncoesGlobais1";
declare var $: any;

export class Text {

  //TEXTOS SE POSICIONAM DE FORMA MUITO SEMELHANTE A NODE!!
  /*public _x_m(x_m: number): Text
  {
    this.x_m = Math.floor(x_m); //A precisão é sempre de 1 metro!!
    this.x_s = FG1.get_x_s_from_x_m(x_m);
    return this;
  }
  public _y_m(y_m: number): Text
  {
    this.y_m = Math.floor(y_m); //A precisão é sempre de 1 metro!!
    this.y_s = FG1.get_y_s_from_y_m(y_m);
    return this;
  }
  public _x_s(x_s: number): Text
  {
    this.x_s = x_s;
    this.x_m = Math.floor(FG1.get_x_m_from_x_s(x_s)); //A precisão é sempre de 1 metro!!
    return this;
  }
  public _y_s(y_s: number): Text
  {
    this.y_s = y_s;
    this.y_m = Math.floor(FG1.get_y_m_from_y_s(y_s)); //A precisão é sempre de 1 metro!!
    return this;
  }*/
  //----------- NEW Performance
  //Por uma questao de performance, criei os metodos _x_y_s e _x_y_m, que alteram os pontos ao mesmo tempo.. Assim, so precisa recalcular algumas coisas 1x...
  public _x_y_s(x_s: number, y_s: number): Text
  {
    this.x_s = x_s;
    this.x_m = Math.floor(FG1.get_x_m_from_x_s(x_s)); //A precisão é sempre de 1 metro!!
    this.y_s = y_s;
    this.y_m = Math.floor(FG1.get_y_m_from_y_s(y_s)); //A precisão é sempre de 1 metro!!
    return this;
  }
  public _x_y_m(x_m: number, y_m: number): Text
  {
    this.x_m = Math.floor(x_m); //A precisão é sempre de 1 metro!!
    this.x_s = FG1.get_x_s_from_x_m(x_m);
    this.y_m = Math.floor(y_m); //A precisão é sempre de 1 metro!!
    this.y_s = FG1.get_y_s_from_y_m(y_m);
    return this;
  }

  public x_m : number; //Posicao em metros, do problema
  public y_m : number; //Posicao em metros, do problema
  public x_s : number; //Posicao em px, na tela
  public y_s : number; //Posicao em px, na tela

  public _text(text: string): Text
  {
    this.text = text;
    return this;
  }

  public text : string; //Texto do Text


  //Azul: #add8e6 Laranja: #ffa07a Verde: #90ee90

  static cor_blue_selecao = '#1a6c9c';
  static cor_green_selecao = '#128817';

  //Status selecao
  public selected_blue : boolean = false;

  public fill_color = "black"; //Cor da fonte
  public font_weight = "normal"; //Negrito da fonte
  public text_decoration = "none";

  public mouse_over(e, is_over : boolean) {

    //Masas isso, muda o cursor do node se desejar, usando jQuery...
    if(is_over)
    {
      //$(e.target).css('cursor','pointer');
      this.fill_color = Text.cor_green_selecao;
      this.font_weight = 'bold';
    }
    else
    {
      //$(e.target).css('cursor','default');
      this.set_style();
    }

  }

  public mouse_down(e) {

    //Por algum bug isso teve uma hr que nao tava ok.. Abri o chrome em private e tava ok... E no normal so funcionava com zoom... Que estranho...
    if(A.a.selected_tool != null) {
      if(A.a.selected_tool.nome_tool == 'selection_blue') {
        this.set_select('selection_blue', true);
      }
      else if (A.a.selected_tool.nome_tool == 'move_hand') {
        if(!e.ctrlKey && !e.shiftKey) {
          //Nao dar drag se o usuario estiver usando ctrl ou shift...
          A.a.draggable_element = this;
        }
      }
    } else {
      //Se ta clicando com nenhuma tool selecionada, então selecionar azul... Somente este node! remover selecao de todos os outros...
      A.a.remover_selecoes();
      this.set_select('selection_blue', true);
    }
  }

  public mouse_up(e) {
    if(A.a.selected_tool != null) {
      if (A.a.selected_tool.nome_tool == 'move_hand') {
        A.a.draggable_element = null;
      }
    }
  }

  public set_select(select_tool : string, s : boolean) {

    if(select_tool == 'selection_blue') {
      this.selected_blue = s;
    };

    this.set_style();
  }

  public invert_select(select_tool : string) {
    if(select_tool == 'selection_blue') this.set_select(select_tool, !this.selected_blue);
  }

  set_style() {
    if(this.selected_blue) {
      this.fill_color = Text.cor_blue_selecao;
      this.font_weight = 'bold';
      this.text_decoration = "underline";
    } else {
      this.fill_color = 'black';
      this.font_weight = 'normal';
      this.text_decoration = "none";
    }
  }
}
