import {AfterViewInit, Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {Problema} from "./Problema";
import {ToolComponent} from "./tools/tool.component";
import {Node} from "./entidades/Node";
import {Edge} from "./entidades/Edge";
import {Text} from "./entidades/Text";
import {Distancia} from "./entidades/Distancia";
import {forEach} from "@angular/router/src/utils/collection";
import {FG1} from "app/funcoes_globais/FuncoesGlobais1";
import {Solver_Dijkstra} from "./solvers/Solver_Dijkstra";
import {Graph} from "./entidades/Graph";
import {Path} from "app/entidades/Path";

declare var $: any;
declare var bootbox: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class A implements OnInit, AfterViewInit {

  //AC, AppComponent

  public static a: A; //Referencia global
  problema_atual : Problema;

  selected_tool: ToolComponent;

  //Referencia estatic da classe Node para ser usada na GUI
  //_static_Node = Node; //Nao to usando...

  //Como ainda nao da pra criar componentes dinamicamente, decidi utilizar mesmo varios ngFor dentro do svg, um pra cada tipo... edges, nodes, etc...
  //No futuro, quando o Angualr evoluir, posso criar componentes dinamicamente... Por enquanto vai de ngFor mesmo, torcendo pra não ter problema de performance...
  //<editor-fold desc="COMPONENTES DINAMICAMENTE">
  //Ta problematico criar dinamicamente os elementos do SVG... acho que vai demorar uns 6 meses ainda pro angular ter compatiblidade boa com cvg...
  //https://github.com/angular/angular/issues/10404
  //--------------------------------------------------------------
  //Se funcionasse, bastava: this.root_svg_placeholder.createComponent(this.nodeComponent);
  //Onde o componente tem um selector do tipo :svg:g[atributo]...
  //--------------------------------------------------------------
  //Decidido usar SVG e não Canvas, pois SVG permite aproveitar varios tratamentos da DOM, CSS, Angular, etc...
  //Enquanto canvas seria algo muito baixo nível, sem nenhum aproveitamento das varias possibilidades de se trabalahr a DOM...
  //https://www.sitepoint.com/canvas-vs-svg-choosing-the-right-tool-for-the-job/
  //TUTORIAL muito vom de SVG com Angular2: https://teropa.info/blog/2016/12/12/graphics-in-angular-2.html
  ////////@ViewChild('root_svg_placeholder', {read: ViewContainerRef}) root_svg_placeholder : ViewContainerRef; //No root_svg que realizo todo o drawning
  //Tutorial de como criar componentes dinamicamente:
  //https://blog.thecodecampus.de/angular-2-dynamically-render-components/

  //Muito grato a esse maravilhoso tutorial de como criar componentes dinamicamente:
  //https://blog.thecodecampus.de/angular-2-dynamically-render-components/
  //Precisa adicionar aos entryComponents do ngModule!
  //--------------------------------------------------------------
  //nodeComponent;
  //--------------------------------------------------------------
  //Muito grato a esse maravilhoso tutorial de como criar componentes dinamicamente:
  //https://blog.thecodecampus.de/angular-2-dynamically-render-components/
  //Optei por ter um controle mais direto do que é construido dentro do SVG, em vez de criar varios ngFors la dentro...
  //Assim, posso remover/adicionar elementos de forma mais pontual, assim como modifica-los, sem precisar da reprint em tudo o tempo todo!
  //this.nodeComponent = _CFR.resolveComponentFactory(NodeComponent);
  //--------------------------------------------------------------
  // <!--Esse treco so ta aqui porque os componentes criados dinamicamente são colocados embaixo de algo, e nao dentro...-->
  // <!--http://stackoverflow.com/questions/38093727/angular2-insert-a-dynamic-component-as-child-of-a-container-in-the-dom-->
  // <svg:g #root_svg_placeholder></svg:g>
  //</editor-fold>

  svg_nodes : Array<Node> = new Array<Node>();
  svg_edges : Array<Edge> = new Array<Edge>();
  svg_texts : Array<Text> = new Array<Text>();

  constructor(private _CFR: ComponentFactoryResolver) {

    A.a = this; //Aplicando a referencia desse objeto AppComponent (A) pra ser acessada de qualquer lugar....

  }

  //Controle de selecao
  select_start_x : number; //Onde a selecao comeca
  select_start_y : number;
  select_x : number;
  select_y : number;
  select_width : number;
  select_height : number;

  //Contadores de selecao!
  selected_blue_count = 0;
  selected_orange_count = 0;

  //Tem momentos interessantes para recontar a selecao... Defino isso em alguns momentos chave
  recontar_selecao_count() {
    let new_blue_count = 0;
    let new_orange_count = 0;
    for(var node of this.svg_nodes) {
      if(node.selected_blue) new_blue_count++;
      if(node.selected_orange) new_orange_count++;
    }

    //So defino no final pq isso dispara change detection!
    this.selected_blue_count = new_blue_count;
    this.selected_orange_count = new_orange_count;
  }

  //Controle de zoom
  public zoom : Distancia = new Distancia()._x(100)._und('m'); //Quantidade de metros em 83px de tela, que é o tamanho da linha verde embaixo do problema de zoom... Default é 100m / 83px
  public zoom_fator : number = this.zoom.x_m / 83; //100m em 83px

  public zoom_or_center_changed() {

    //Recalculando o zoom factor...
    this.zoom_fator = this.zoom.x_m / 83;

    //Se o zoom mudou, recalcular todos os x_s e y_s:
    for(let node of this.svg_nodes) {
      node._x_m(node.x_m); //Isso redfine o x_m, que nao mudou, mas nisso recalcula-se o x_s...
      node._y_m(node.y_m);
    }

    for(let text of this.svg_texts) {
      text._x_m(text .x_m); //Isso redfine o x_m, que nao mudou, mas nisso recalcula-se o x_s...
      text._y_m(text.y_m);
    }
  }

  //Quando for pegar o valor LOGICO, do mapa, em metros: MULTIPLICAR o valor na screen por zoom_fator;
  //Quando for pegar o valor da SCREEN, em px, da tela: DIVIDIR o valor logico por zoom_fator;

  mouse_wheel_zoom_step = 0.1;
  mouse_wheel(e) {

    //EU RECRIO uma nova Distancia, para disparar o "zoom | input_distancia", pq nao quero usar pipes impuros, e colocar zoom.x_m nao da certo tb...
    if(e.deltaY > 0) this.step_zoom(true); //Rolando pra cima - Aumentar o zoom em
    else this.step_zoom(false); //Rolando pra baixo

  }

  //True é up, false é down...
  step_zoom(up_down :boolean) {

    //EU RECRIO uma nova Distancia, para disparar o "zoom | input_distancia", pq nao quero usar pipes impuros, e colocar zoom.x_m nao da certo tb...
    if(up_down) {
      this.zoom = new Distancia()._x(Math.round(this.zoom.x*(1+this.mouse_wheel_zoom_step) * 1000) / 1000)._und(this.zoom.und); //Multiplicando pot 1+passo e arredodando pra 3 casas decimais
    } else {
      this.zoom = new Distancia()._x(Math.round(this.zoom.x*(1-this.mouse_wheel_zoom_step) * 1000) / 1000)._und(this.zoom.und); //Mesma coisa, mas é 1 - o passo..
    }

    this.zoom_or_center_changed();
  }

  //Variaveis da pan_line
  pan_line_x_s_1 = null; pan_line_y_s_1 = null; pan_line_x_s_2 = null; pan_line_y_s_2 = null;
  //O centro comeca com metade do tamanho do svg, definido em
  x_s_middle_center = 0; y_s_middle_center = 0;
  //Controlando que posicao do mapa logico, real, esta no centro da tela
  x_m_centro = 0; y_m_centro = 0; //Quando der PAN, alterar esses valores

  //Variaveis da ferramenta link_node
  link_node_a : Node;
  link_node_x_s_2 = 0; link_node_y_s_2 = 0;

  mouse_moving(e) {

    if(this.selected_tool != null ) {

      if(this.selected_tool.nome_tool == 'selection-blue' || this.selected_tool.nome_tool == 'selection-orange') {

        if(e.which == 1) { //https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/which

          if((e.offsetX - this.select_start_x) > 0) {
            this.select_x = this.select_start_x;
            this.select_width = e.offsetX - this.select_start_x;
          } else {
            this.select_x = e.offsetX;
            this.select_width = this.select_start_x - e.offsetX;
          }

          if((e.offsetY - this.select_start_y) > 0) {
            this.select_y = this.select_start_y;
            this.select_height = e.offsetY - this.select_start_y;
          } else {
            this.select_y = e.offsetY;
            this.select_height = this.select_start_y - e.offsetY;
          }
        } else {
          this.select_width = 0;
          this.select_height = 0;
        }

      }
      else if(this.selected_tool.nome_tool == 'link_nodes' ) {

        if(e.which == 1 && this.link_node_a != null) {
          this.link_node_x_s_2 = e.offsetX - 1; //Esse -1 é só um desconto, se nao o rect fica no meio e nao pega os nodes...
          this.link_node_y_s_2 = e.offsetY - 1; //Esse -1 é só um desconto, se nao o rect fica no meio e nao pega os nodes...
        } else {
          this.link_node_a = null;
          this.link_node_x_s_2 = 0;
          this.link_node_y_s_2 = 0;
        }
      }
      else if(this.selected_tool.nome_tool == 'move_hand' ) {

        //Se esta segurando o mouse e existe um draggabe_element
        if(e.which == 1 && this.draggable_element != null) {
          this.draggable_element._x_s(e.offsetX+8);
          this.draggable_element._y_s(e.offsetY+8);
        } else {

          this.draggable_element = null;

          //Aproveitando a linha de PAN pra dar MOVE com ctrl em varios nodes selecionados de azul!!
          if(e.which == 1 && e.ctrlKey && this.pan_line_x_s_1 != null && this.pan_line_y_s_1 != null) {

            this.pan_line_x_s_2 = e.offsetX + 8; //Pequeno ajuste pra ficar visualmente legal
            this.pan_line_y_s_2 = e.offsetY + 8;

          } else {
            this.pan_line_x_s_1 = null;
            this.pan_line_y_s_1 = null;
            this.pan_line_x_s_2 = null;
            this.pan_line_y_s_2 = null;
          }
        }
      }

    } else {
      //Se esta movendo o mouse sem nenhuma tool, e o botao esta segurado, entao realizar PAN
      //Se comecar o PAN de fora, ou seja, nao foi de um mouse_down dentro... Entao nao considerar...
      if(e.which == 1 && this.pan_line_x_s_1 != null && this.pan_line_y_s_1 != null) {
        this.pan_line_x_s_2 = e.offsetX;
        this.pan_line_y_s_2 = e.offsetY;
      } else {
        this.pan_line_x_s_1 = 0;
        this.pan_line_y_s_1 = 0;
        this.pan_line_x_s_2 = 0;
        this.pan_line_y_s_2 = 0;
      }
    }

  }

  //Quando algum elemento é clicado pela move_hand, ele se torna o elemento draggado, e sua posicao x_s e y_s vao ser alteradas...
  //Vale pra qualquer coisa draggable, como Node, text...
  public draggable_element;

  mouse_down(e) {

    if(e.which == 3) { //Se foi click com o right-button
      if(this.selected_tool != null ) {
        this.selected_tool.deselecionar_tool();
      } else {
        //Se ta clicando com o left button e JA tinha nenhuma tool selecionada, entao:
        this.remover_selecoes();
      }
      this.selected_tool = null; //Remover tools..
    } else {

      if(this.selected_tool != null ) {
        if(this.selected_tool.nome_tool == 'selection-blue' || this.selected_tool.nome_tool == 'selection-orange') {
          //Marcando onde a selecao comeca
          this.select_start_x = e.offsetX;
          this.select_start_y = e.offsetY;
        } else if(this.selected_tool.nome_tool == 'add_node') {
          //Adicionando NODE
          this.svg_nodes.push(new Node()._x_s(e.offsetX)._y_s(e.offsetY));
        }
        else if(this.selected_tool.nome_tool == 'move_hand') {
          //Usando a linha de pan pra move com ctrl!!
          this.pan_line_x_s_1 = e.offsetX;
          this.pan_line_y_s_1 = e.offsetY;
          this.pan_line_x_s_2 = e.offsetX;
          this.pan_line_y_s_2 = e.offsetY;
        }
      } else {
        //Se clicar, sem nenhuma tool, entao iniciar PAN
        if(e.which == 1) {
          this.pan_line_x_s_1 = e.offsetX;
          this.pan_line_y_s_1 = e.offsetY;
          this.pan_line_x_s_2 = e.offsetX;
          this.pan_line_y_s_2 = e.offsetY;
        }
      }
    }
  }

  mouse_up(e) {

    if(this.selected_tool != null ) {
      if(this.selected_tool.nome_tool == 'selection-blue' || this.selected_tool.nome_tool == 'selection-orange') {
        //Apos qualquer mudanca na area de selecao, calcular quais sao os nodes selecionados
        //Sao todos aqueles onde x e y se encontram dentro do quadrado:
        for(let node of this.svg_nodes) {
          //Se estiver dentro do quadrado, então esta selecionado...
          if(node.x_s > this.select_x && node.x_s < (this.select_x + this.select_width) && node.y_s > this.select_y && node.y_s < (this.select_y + this.select_height)) {
            node.invert_select(this.selected_tool.nome_tool);
          }
        }
        if(!e.ctrlKey) {
          //O mesmo vale para textos:
          for(let text of this.svg_texts) {
            //Se estiver dentro do quadrado, então esta selecionado...
            if(text.x_s > this.select_x && text.x_s < (this.select_x + this.select_width) && text.y_s > this.select_y && text.y_s < (this.select_y + this.select_height)) {
              text.invert_select(this.selected_tool.nome_tool);
            }
          }
          //Selecionando tambem edges...
          //No caso dos edges, se aplica a inversao neles se eles estiverem com as duas pontas dentro do que foi selecionado
          for(let edge of this.svg_edges) {
            if((edge.nA.x_s > this.select_x && edge.nA.x_s < (this.select_x + this.select_width) && edge.nA.y_s > this.select_y && edge.nA.y_s < (this.select_y + this.select_height))
              && (edge.nB.x_s > this.select_x && edge.nB.x_s < (this.select_x + this.select_width) && edge.nB.y_s > this.select_y && edge.nB.y_s < (this.select_y + this.select_height))) {
              edge.invert_select(this.selected_tool.nome_tool);
            }
          }
        }
        //Ao final de tudo, recontar selecoes...
        A.a.recontar_selecao_count();
      }
      else if(this.selected_tool.nome_tool == 'insert_text') {
        //Requisitar texto pelo bootbox
        bootbox.prompt("Inserir texto", (txt) => {
          //Quando o usuario colocar o texto, adicionar um objeto do tipo Texto
          this.svg_texts.push(new Text()._x_s(e.offsetX)._y_s(e.offsetY+12)._text(txt)); //Pequeno ajuste pra posicionar melhor em relacao o clique...
        });
      }
      else if(this.selected_tool.nome_tool == 'move_hand' ) {

        //Se esta segurando o mouse e existe um draggabe_element
        if(e.which == 1 && this.draggable_element == null && e.ctrlKey) {
          for(let node of this.svg_nodes) {
            if(node.selected_blue) {
              //Mesma movimentação do PAN! So que sem mudar centro...
              node._x_s(node.x_s + this.pan_line_x_s_2 - this.pan_line_x_s_1);
              node._y_s(node.y_s + this.pan_line_y_s_2 - this.pan_line_y_s_1);
            }
          }
          //Tambem mover os textos!
          for(let text of this.svg_texts) {
            if(text.selected_blue) {
              //Mesma movimentação do PAN! So que sem mudar centro...
              text._x_s(text.x_s + this.pan_line_x_s_2 - this.pan_line_x_s_1);
              text._y_s(text.y_s + this.pan_line_y_s_2 - this.pan_line_y_s_1);
            }
          }
        }
      }
    } else {
      //Se levantou o mouse sem nenhuma tool, entao é PAN
      //Deslocando o local logico do mapa que ficará no centro!!
      //Perceba que eu pego o que foi deslocado no PAN, em valores SCREEN, e transformo no deslocamento em METROS, dividindo por zoom fator...
      this.x_m_centro -= FG1.get_x_m_from_x_s(this.pan_line_x_s_2) - FG1.get_x_m_from_x_s(this.pan_line_x_s_1);
      this.y_m_centro -= FG1.get_y_m_from_y_s(this.pan_line_y_s_2) - FG1.get_y_m_from_y_s(this.pan_line_y_s_1);
      this.zoom_or_center_changed();
    }
  }

  mouse_leave(e) {

    this.select_width = 0;
    this.select_height = 0;

    this.pan_line_x_s_1 = null;
    this.pan_line_y_s_1 = null;
    this.pan_line_x_s_2 = null;
    this.pan_line_y_s_2 = null;

  }

  remover_selecoes() {
    //Removendo todas as selecoes...
    for(let node of this.svg_nodes) {
      node.set_select('selection-blue',false);
      node.set_select('selection-orange',false);
    }

    //Removendo todas as selecoes...
    for(let node of this.svg_edges) {
      node.set_select('selection-blue',false);
      node.set_select('selection-orange',false);
    }

    //Removendo todas as selecoes...
    for(let text of this.svg_texts) {
      text.set_select('selection-blue',false);
    }

    this.recontar_selecao_count();
  }

  ngOnInit(): void {

    this.problema_atual = new Problema();


    //Desligando o context menu dentro do svg: http://stackoverflow.com/questions/10864249/disabling-right-click-context-menu-on-a-html-canvas
    $('svg').bind('contextmenu', function(e){ return false; });

  }

  resetar_tamanhos_mapa(e) {

    //O evento refere-se a window... Então, pegar novamente os tamanhos com jQuery...

    this.x_s_middle_center = $('#root_svg').width()/2;
    this.y_s_middle_center = $('#root_svg').height()/2;
    this.zoom_or_center_changed();

  }

  deletar_selecionados() {
    bootbox.confirm({
      message: "Deseja mesmo deletar todos os itens selecionados de azul? As arestas ligadas aos vértices também serão deletadas!",
      size: 'large',
      buttons: {
        cancel: { label: 'Cancelar', className: 'btn-success' },
        confirm: { label: 'Deletar', className: 'btn-danger' }
      }, callback: (doit) => {
        if(doit) {
          //Removendo nodes
          for(var i = this.svg_nodes.length; i--;){
            if (this.svg_nodes[i].selected_blue) {

              //Removendo edges com esse node em nA ou nB...
              for(var ii = this.svg_edges.length; ii--;){
                if (this.svg_edges[ii].nA == this.svg_nodes[i] || this.svg_edges[ii].nB == this.svg_nodes[i] )
                {
                  this.svg_edges.splice(ii, 1);
                }

              }

              //Removendo node da array
              this.svg_nodes.splice(i, 1);
            }
          }
          //Removendo textos
          for(var i = this.svg_texts.length; i--;){
            if (this.svg_texts[i].selected_blue) this.svg_texts.splice(i, 1);
          }
          //Removendo edges
          for(var i = this.svg_edges.length; i--;){
              //Removendo node da array
            if (this.svg_edges[i].selected_blue) this.svg_edges.splice(i, 1);
          }

          A.a.recontar_selecao_count();
        }
      }
    });
  }

  interconectar_nodes_sel_vermelho() {

    for(var i = this.svg_nodes.length; i--;) {
      //Checar todos os nodes selecionados de laranja
      if(this.svg_nodes[i].selected_orange) {
        //Procurar agora outro node, selecionado de laranja, que nao seja esse
        for(var ii = i; ii--;) { //Pesquisar sem pesqusiar o que ja pesquisou antes!!! Essa é a tecnica! ;DD
          //Checar todos os nodes selecionados de laranja
          if(this.svg_nodes[ii].selected_orange && this.svg_nodes[ii] != this.svg_nodes[i]) {
            //Pronto, vou verificar se existe algum edge entre esses nodes, se não, vou criar
            let achou_algum = false;
            for(var edge of this.svg_edges) {
              if((edge.nA == this.svg_nodes[i] && edge.nB == this.svg_nodes[ii]) || (edge.nB == this.svg_nodes[i] && edge.nA == this.svg_nodes[ii])) {
                achou_algum = true;
                break;
              }
            }
            if(!achou_algum) {
              //Se nao achou nenhum, entao adicionar:
              this.svg_edges.push(new Edge()._nA(this.svg_nodes[i])._nB(this.svg_nodes[ii]));
            }
          }
        }
      }
    }
  }

  ngAfterViewInit(): void {

    //console.log($(this.root_svg));

    // $(this.root_svg).append('<svg:line x1="0" y1="0" x2="220" y2="11" style="stroke:rgb(255,0,0);stroke-width:2" />');
    // $(this.root_svg).append('<svg:line x1="0" y1="0" x2="220" y2="11" style="stroke:rgb(255,0,0);stroke-width:2" />');
    // $(this.root_svg).append('<svg:line x1="0" y1="0" x2="220" y2="11" style="stroke:rgb(255,0,0);stroke-width:2" />');

    /*var circle = d3.select('root_svg').append("circle")
      .attr("r", "10")
      .attr("style", "fill:white;stroke:black;stroke-width:5");*/

    this.resetar_tamanhos_mapa(null);

    //let temp_teste_x = $('#root_svg').width();
    //let temp_teste_y = $('#root_svg').height();
    // for(var k = 0; k < 20; k++) {
    //   this.svg_nodes.push(new Node()._x_m((Math.random()*temp_teste_x)-temp_teste_x/2)._y_m((Math.random()*temp_teste_y)-temp_teste_y/2));
    //   this.svg_nodes.push(new Node()._x_m((Math.random()*temp_teste_x)-temp_teste_x/2)._y_m((Math.random()*temp_teste_y)-temp_teste_y/2));
    //   this.svg_edges.push(new Edge()._nA(this.svg_nodes[2*k])._nB(this.svg_nodes[2*k+1]));
    // }



  }

  calcular_melhor_rota() {

    var nodeA = null;
    var nodeB = null;

    //Procurando pelos dois nodes selecionados orange
    for(let node of this.svg_nodes) {
      if (node.selected_orange) {
        if(nodeA == null) nodeA = node;
        else {
          nodeB = node;
          break;
        }
      }
    }

    var caminho_otimo : Path = Solver_Dijkstra.find_best_route_Dijkstra(new Graph()._nodes(this.svg_nodes)._edges(this.svg_edges), nodeA, nodeB);

    this.remover_selecoes();

    //Marcando os edges e nodes do caminho otimo!
    for(let node of caminho_otimo.nodes) {
      node.set_select('selection-orange', true);
    }
    for(let edge of caminho_otimo.edges) {
      edge.set_select('selection-orange', true);
    }

  }

}
