import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ProblemaService} from "./Problema";
import {ToolComponent} from "./tools/tool.component";
import {Node} from "./entidades/Node";
import {Edge} from "./entidades/Edge";
import {Text} from "./entidades/Text";
import {Distancia} from "./entidades/Distancia";
import {FG1} from "app/funcoes_globais/FuncoesGlobais1";
import {Solver_Dijkstra} from "./solvers/Solver_Dijkstra";
import {Graph} from "./entidades/Graph";
import {Path} from "app/entidades/Path";
import {gMaps} from "./GoogleMaps";

declare var $: any;
declare var bootbox: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', 'versioning.css']
})
export class A implements OnInit, AfterViewInit {

  //AC, AppComponent

  public static a: A; //Referencia global
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

  constructor(public _P: ProblemaService) {
    A.a = this; //Aplicando a referencia desse objeto AppComponent (A) pra ser acessada de qualquer lugar....
  }

  //Controle de selecao
  select_start_x : number; //Onde a selecao comeca
  select_start_y : number;
  select_x : number;
  select_y : number;
  select_width : number;
  select_height : number;
  //#add8e6a1 - Para selecao azul
  //#ffa07aa1 - Para selecao orange
  select_fill : string;
  public config_inicial_selecao(tipo: string) {
    if(tipo == 'blue') {
      this.select_fill = 'rgba(173,216,230,0.4)';
    } else if(tipo == 'orange') {
      this.select_fill = 'rgba(255,160,122,0.35)';
    }
  }

  //Contadores de selecao!
  selected_blue_count = 0;
  selected_orange_count = 0;

  //Tem momentos interessantes para recontar a selecao... Defino isso em alguns momentos chave
  recontar_selecao_count() {
    let new_blue_count = 0;
    let new_orange_count = 0;
    for(var node of this._P.p.g.nodes) {
      if(node.selected_blue) new_blue_count++;
      if(node.selected_orange) new_orange_count++;
    }

    //So defino no final pq isso dispara change detection!
    this.selected_blue_count = new_blue_count;
    this.selected_orange_count = new_orange_count;
  }

  public zoom_or_center_changed() {

    if(this.gmaps_onoff && gMaps.gmap != null) {

      //Considerando zoom factor (m/p) de gMap
      this._P.p.zoom_fator = gMaps.get_meters_per_pixel();

      //Como o zoom factor e considerado de la, então o zoom (Distancia) que aparece na tela vem desse zoomFactor
      //O que vai aparecer na tela terá uma imprecisão de varias casas decimais... Mas não tem problema, internamente o zoom factor ta correto...
      this._P.p.zoom = new Distancia()._x_und(Math.floor(this._P.p.zoom_fator*83),'m')._und(this._P.p.zoom.und); //Define em metro, depois converte pra unidade que ja tava aparecendo antes...

      //Quando se usa gMaps, ao contrario do zoom, que é definido no Grid em função do gMaps... O centro é definido no Grid primeiro, e no gMaps em função do Grid...
      //O google carregou com uma latInicial e uma lngInicial, que correspondem a x_m_centro = 0 e y_m_centro = 0;
      //Agora, tenho que especificar novas lat e lng pro gMaps, baseado nos novos x_m_centro e y_m_centro.
      //Para tanto, criei a a função recalcular_centro.
      gMaps.recalcular_centro(this._P.p.x_m_centro, this._P.p.y_m_centro);

    } else {
      //Considerando zoom normal:

      //Recalculando o zoom factor...
      this._P.p.zoom_fator = this._P.p.zoom.x_m / 83;
    }

    //Se o zoom mudou, recalcular todos os x_s e y_s:
    for(let node of this._P.p.g.nodes) {
      node._x_m(node.x_m); //Isso redfine o x_m, que nao mudou, mas nisso recalcula-se o x_s...
      node._y_m(node.y_m);
    }

    for(let text of this._P.p.svg_texts) {
      text._x_m(text.x_m); //Isso redfine o x_m, que nao mudou, mas nisso recalcula-se o x_s...
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

    if(this.gmaps_onoff && gMaps.gmap != null) {
      //Quando for zoom usando gMaps, simplemente incrementar ou decrementar o zoomLevel:
      if(up_down && (gMaps.gmap.getZoom()-1 >= 0)) gMaps.gmap.setZoom(gMaps.gmap.getZoom()-1);
      if(!up_down && (gMaps.gmap.getZoom()+1 <= 18)) gMaps.gmap.setZoom(gMaps.gmap.getZoom()+1);

    } else
    {
      //Recalculando zoom normal:
      //EU RECRIO uma nova Distancia, para disparar o "zoom | input_distancia", pq nao quero usar pipes impuros, e colocar zoom.x_m nao da certo tb...
      if(up_down) {
        this._P.p.zoom = new Distancia()._x_und(Math.round(this._P.p.zoom.x*(1+this.mouse_wheel_zoom_step) * 1000) / 1000,this._P.p.zoom.und); //Multiplicando pot 1+passo e arredodando pra 3 casas decimais
      } else {
        this._P.p.zoom = new Distancia()._x_und(Math.round(this._P.p.zoom.x*(1-this.mouse_wheel_zoom_step) * 1000) / 1000,this._P.p.zoom.und); //Mesma coisa, mas é 1 - o passo..
      }
    }
    this.zoom_or_center_changed();
  }

  //Variaveis da pan_line
  pan_line_x_s_1 = null; pan_line_y_s_1 = null; pan_line_x_s_2 = null; pan_line_y_s_2 = null;
  //O centro comeca com metade do tamanho do svg, definido em resetar_tamanhos_mapa(). //Isso precisa ser chamado em qualquer resize do svg
  x_s_middle_center = 0; y_s_middle_center = 0;

  //Variaveis da ferramenta link_node
  link_node_a : Node;
  link_node_x_s_2 = 0; link_node_y_s_2 = 0;

  //Mostrando com ate 1 metro de precisão
  indicador_mouse_x = 0;
  indicador_mouse_y = 0;

  mouse_moving(e) {

    //Mostrando com ate 1 metro de precisão
    this.indicador_mouse_x = Math.floor(FG1.get_x_m_from_x_s(e.offsetX));
    this.indicador_mouse_y = Math.floor(FG1.get_y_m_from_y_s(e.offsetY));

    if(this.selected_tool != null ) {

      if(this.selected_tool.nome_tool == 'selection_blue' || this.selected_tool.nome_tool == 'selection_orange') {

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
          //Antigamente e.offsetX+8, mas depois passei a colocar o click de move no centro do cursor, dai nao precisa esse ajuste...
          this.draggable_element._x_s(e.offsetX);
          this.draggable_element._y_s(e.offsetY);
        } else {

          this.draggable_element = null;

          //Aproveitando a linha de PAN pra dar MOVE com ctrl em varios nodes selecionados de azul!!
          if(e.which == 1 && e.ctrlKey && this.pan_line_x_s_1 != null && this.pan_line_y_s_1 != null) {

            //Antigamente e.offsetX+8, mas depois passei a colocar o click de move no centro do cursor, dai nao precisa esse ajuste...
            this.pan_line_x_s_2 = e.offsetX; //OLD: Pequeno ajuste pra ficar visualmente legal
            this.pan_line_y_s_2 = e.offsetY;

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
      if(e.which == 1 && this.pan_line_x_s_1 > 0 && this.pan_line_y_s_1 > 0) {
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
        if(this.selected_tool.nome_tool == 'selection_blue' || this.selected_tool.nome_tool == 'selection_orange') {
          //Marcando onde a selecao comeca
          this.select_start_x = e.offsetX;
          this.select_start_y = e.offsetY;
        } else if(this.selected_tool.nome_tool == 'add_node') {
          //Adicionando NODE
          this._P.p.g.nodes.push(new Node()._x_s(e.offsetX)._y_s(e.offsetY));
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
      if(this.selected_tool.nome_tool == 'selection_blue' || this.selected_tool.nome_tool == 'selection_orange') {
        //Apos qualquer mudanca na area de selecao, calcular quais sao os nodes selecionados
        //Sao todos aqueles onde x e y se encontram dentro do quadrado:
        for(let node of this._P.p.g.nodes) {
          //Se estiver dentro do quadrado, então esta selecionado...
          if(node.x_s > this.select_x && node.x_s < (this.select_x + this.select_width) && node.y_s > this.select_y && node.y_s < (this.select_y + this.select_height)) {
            node.invert_select(this.selected_tool.nome_tool);
          }
        }
        if(!e.ctrlKey) {
          //O mesmo vale para textos:
          for(let text of this._P.p.svg_texts) {
            //Se estiver dentro do quadrado, então esta selecionado...
            if(text.x_s > this.select_x && text.x_s < (this.select_x + this.select_width) && text.y_s > this.select_y && text.y_s < (this.select_y + this.select_height)) {
              text.invert_select(this.selected_tool.nome_tool);
            }
          }
          //Selecionando tambem edges...
          //No caso dos edges, se aplica a inversao neles se eles estiverem com as duas pontas dentro do que foi selecionado
          for(let edge of this._P.p.g.edges) {
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
          this._P.p.svg_texts.push(new Text()._x_s(e.offsetX)._y_s(e.offsetY+4)._text(txt)); //Pequeno ajuste pra posicionar melhor em relacao o clique...
        });
      }
      else if(this.selected_tool.nome_tool == 'move_hand' ) {

        //Se esta segurando o mouse e existe um draggabe_element
        if(e.which == 1 && this.draggable_element == null && e.ctrlKey) {
          if(!e.shiftKey) //Sem shift, apenas move...
          {
            for(let node of this._P.p.g.nodes) {
              if(node.selected_blue) {
                //Apenas movendo
                //Mesma movimentação do PAN! So que sem mudar centro...
                node._x_s(node.x_s + this.pan_line_x_s_2 - this.pan_line_x_s_1);
                node._y_s(node.y_s + this.pan_line_y_s_2 - this.pan_line_y_s_1);
              }
            }
            //Tambem mover os textos!
            for(let text of this._P.p.svg_texts) {
              if(text.selected_blue) {
                //Mesma movimentação do PAN! So que sem mudar centro...
                text._x_s(text.x_s + this.pan_line_x_s_2 - this.pan_line_x_s_1);
                text._y_s(text.y_s + this.pan_line_y_s_2 - this.pan_line_y_s_1);
              }
            }
          }
          else //Com shift, copia. Se o Shift estiver pressionado, nao mover, criar novos!!
          {
            //Por incrivel que pareça, é mais interessante começar a copia pelos edges selecionados...
            //A regra é: Se um edge foi selecionado, copiar ele e seus nodes!
            //Se um node foi selecionado, sem edge selecionado ligado a ele, copiar so ele...
            //Começo copiando os edges, e fazendo uma correlação dos clones...
            //Depois eu saio verificando todos os nodes selecionados, pra saber quais não foram copiados por causa dos edes...
            //E ai copio esses nodes avulsos

            let nodes_e_clones : Map<Node,Node> = new Map<Node,Node>();

            for(let edge of this._P.p.g.edges) {
              if(edge.selected_blue) {
                //Encontrando os nodes clonados pra ligar com esse edge... Se ainda nao existir, então criar...
                let node_clonado_nA : Node;
                let node_clonado_nB : Node;

                node_clonado_nA = nodes_e_clones.get(edge.nA);

                //Se nao foi clonado, clonar
                if(node_clonado_nA == null) {
                  node_clonado_nA = new Node()
                    ._x_s(edge.nA.x_s + this.pan_line_x_s_2 - this.pan_line_x_s_1)
                    ._y_s(edge.nA.y_s + this.pan_line_y_s_2 - this.pan_line_y_s_1);
                  nodes_e_clones.set(edge.nA,node_clonado_nA);
                  this._P.p.g.nodes.push(node_clonado_nA);
                }

                node_clonado_nB = nodes_e_clones.get(edge.nB);

                //Se nao foi clonado, clonar
                if(node_clonado_nB == null) {
                  node_clonado_nB = new Node()
                    ._x_s(edge.nB.x_s + this.pan_line_x_s_2 - this.pan_line_x_s_1)
                    ._y_s(edge.nB.y_s + this.pan_line_y_s_2 - this.pan_line_y_s_1);
                  nodes_e_clones.set(edge.nB,node_clonado_nB);
                  this._P.p.g.nodes.push(node_clonado_nB);
                }

                //Adicionando o clone do edge:
                this._P.p.g.edges.push(new Edge()._nA(node_clonado_nA)._nB(node_clonado_nB));
              }
            }

            //Agora vou checar se algum node avulso, selecionado, não foi copiado...
            let nodes_ja_copiados : Array<Node> = Array.from(nodes_e_clones.keys());

            for(let node of this._P.p.g.nodes) {
              if(node.selected_blue) {

                //Se nao foi copiado ainda, copiar
                if(!nodes_ja_copiados.includes(node)) {
                  //Copiando os nodes...
                  this._P.p.g.nodes.push(new Node()
                    ._x_s(node.x_s + this.pan_line_x_s_2 - this.pan_line_x_s_1)
                    ._y_s(node.y_s + this.pan_line_y_s_2 - this.pan_line_y_s_1));

                  //Se um dia precisar utilizar nodes_e_clones mais a frente, entao tambem dar nodes_e_clones.set aqui...
                }
              }
            }

            //Tambem copiar os textos!
            for(let text of this._P.p.svg_texts) {
              if(text.selected_blue) {
                //Mesma movimentação do PAN! So que sem mudar centro...
                this._P.p.svg_texts.push(
                  new Text()
                    ._x_s(text.x_s + this.pan_line_x_s_2 - this.pan_line_x_s_1)
                    ._y_s(text.y_s + this.pan_line_y_s_2 - this.pan_line_y_s_1)
                    ._text(text.text)
                );
              }
            }
          }

        }
      }
    } else {
      //Se levantou o mouse sem nenhuma tool, entao é PAN
      //Deslocando o local logico do mapa que ficará no centro!!
      //Perceba que eu pego o que foi deslocado no PAN, em valores SCREEN, e transformo no deslocamento em METROS, dividindo por zoom fator...
      this._P.p.x_m_centro -= FG1.get_x_m_from_x_s(this.pan_line_x_s_2) - FG1.get_x_m_from_x_s(this.pan_line_x_s_1);
      this._P.p.y_m_centro -= FG1.get_y_m_from_y_s(this.pan_line_y_s_2) - FG1.get_y_m_from_y_s(this.pan_line_y_s_1);
      this.zoom_or_center_changed();
    }
  }

  mouse_leave(e) {

    this.indicador_mouse_x = 0;
    this.indicador_mouse_y = 0;

    this.select_width = 0;
    this.select_height = 0;

    this.pan_line_x_s_1 = null;
    this.pan_line_y_s_1 = null;
    this.pan_line_x_s_2 = null;
    this.pan_line_y_s_2 = null;

  }

  mouse_enter(e) {

    this.indicador_mouse_x = Math.floor(FG1.get_x_m_from_x_s(e.offsetX));
    this.indicador_mouse_y = Math.floor(FG1.get_y_m_from_y_s(e.offsetY));

  }

  remover_selecoes() {
    //Removendo todas as selecoes...
    for(let node of this._P.p.g.nodes) {
      node.set_select('selection_blue',false);
      node.set_select('selection_orange',false);
    }

    //Removendo todas as selecoes...
    for(let node of this._P.p.g.edges) {
      node.set_select('selection_blue',false);
      node.set_select('selection_orange',false);
    }

    //Removendo todas as selecoes...
    for(let text of this._P.p.svg_texts) {
      text.set_select('selection_blue',false);
    }

    this.recontar_selecao_count();
  }

  ngOnInit(): void {

    //Desligando o context menu dentro do svg: http://stackoverflow.com/questions/10864249/disabling-right-click-context-menu-on-a-html-canvas
    $('svg').bind('contextmenu', function(e){ return false; });

  }

  @ViewChild('wrapper') wrapper;

  resetar_tamanhos_mapa() {
    //EDIT: Esse evento só é chamado quando a window muda de tamanho... Não consegui um onresize, ou on-resize ou (resize) independente de qualquer coisa...
    //Portanto, alterações por jquerui resizable, ou por aparecer prancheta ou similares... Todas elas devem disparar essa função...

    /*OLD
    //O evento refere-se a window... Então, pegar novamente os tamanhos com jQuery...
    this.x_s_middle_center = $('#root_svg').width()/2;
    this.y_s_middle_center = $('#root_svg').height()/2;
    */

    //NEW:
    this.x_s_middle_center = this.wrapper.nativeElement.offsetWidth/2;
    this.y_s_middle_center = this.wrapper.nativeElement.offsetHeight/2;

    //Com isso, altera o tamanho do mapa do gMaps tambem
    gMaps.resetar_tamanho_mapa();

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
          for(var i = this._P.p.g.nodes.length; i--;){
            if (this._P.p.g.nodes[i].selected_blue) {

              //Removendo edges com esse node em nA ou nB...
              for(var ii = this._P.p.g.edges.length; ii--;){
                if (this._P.p.g.edges[ii].nA == this._P.p.g.nodes[i] || this._P.p.g.edges[ii].nB == this._P.p.g.nodes[i] )
                {
                  this._P.p.g.edges.splice(ii, 1);
                }

              }

              //Removendo node da array
              this._P.p.g.nodes.splice(i, 1);
            }
          }
          //Removendo textos
          for(var i = this._P.p.svg_texts.length; i--;){
            if (this._P.p.svg_texts[i].selected_blue) this._P.p.svg_texts.splice(i, 1);
          }
          //Removendo edges
          for(var i = this._P.p.g.edges.length; i--;){
              //Removendo node da array
            if (this._P.p.g.edges[i].selected_blue) this._P.p.g.edges.splice(i, 1);
          }

          A.a.recontar_selecao_count();
        }
      }
    });
  }

  interconectar_nodes_sel_vermelho() {

    for(var i = this._P.p.g.nodes.length; i--;) {
      //Checar todos os nodes selecionados de laranja
      if(this._P.p.g.nodes[i].selected_orange) {
        //Procurar agora outro node, selecionado de laranja, que nao seja esse
        for(var ii = i; ii--;) { //Pesquisar sem pesqusiar o que ja pesquisou antes!!! Essa é a tecnica! ;DD
          //Checar todos os nodes selecionados de laranja
          if(this._P.p.g.nodes[ii].selected_orange && this._P.p.g.nodes[ii] != this._P.p.g.nodes[i]) {
            //Pronto, vou verificar se existe algum edge entre esses nodes, se não, vou criar
            let achou_algum = false;
            for(var edge of this._P.p.g.edges) {
              if((edge.nA == this._P.p.g.nodes[i] && edge.nB == this._P.p.g.nodes[ii]) || (edge.nB == this._P.p.g.nodes[i] && edge.nA == this._P.p.g.nodes[ii])) {
                achou_algum = true;
                break;
              }
            }
            if(!achou_algum) {
              //Se nao achou nenhum, entao adicionar:
              this._P.p.g.edges.push(new Edge()._nA(this._P.p.g.nodes[i])._nB(this._P.p.g.nodes[ii]));
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

    this.resetar_tamanhos_mapa();

    //let temp_teste_x = $('#root_svg').width();
    //let temp_teste_y = $('#root_svg').height();
    // for(var k = 0; k < 20; k++) {
    //   this._P.p.g.nodes.push(new Node()._x_m((Math.random()*temp_teste_x)-temp_teste_x/2)._y_m((Math.random()*temp_teste_y)-temp_teste_y/2));
    //   this._P.p.g.nodes.push(new Node()._x_m((Math.random()*temp_teste_x)-temp_teste_x/2)._y_m((Math.random()*temp_teste_y)-temp_teste_y/2));
    //   this._P.p.g.edges.push(new Edge()._nA(this._P.p.g.nodes[2*k])._nB(this._P.p.g.nodes[2*k+1]));
    // }

  }

  calcular_melhor_rota() {

    var nodeA = null;
    var nodeB = null;

    //Procurando pelos dois nodes selecionados orange
    for(let node of this._P.p.g.nodes) {
      if (node.selected_orange) {
        if(nodeA == null) nodeA = node;
        else {
          nodeB = node;
          break;
        }
      }
    }

    var caminho_otimo : Path = Solver_Dijkstra.find_best_route_Dijkstra(new Graph()._nodes(this._P.p.g.nodes)._edges(this._P.p.g.edges), nodeA, nodeB);

    this.remover_selecoes();

    //Marcando os edges e nodes do caminho otimo!
    for(let node of caminho_otimo.nodes) {
      node.set_select('selection_orange', true);
    }
    for(let edge of caminho_otimo.edges) {
      edge.set_select('selection_orange', true);
    }

    //Recontando selecionados
    this.recontar_selecao_count();

  }

  gmaps_onoff = false;
  turnon_gmaps(turnon : boolean) {

    if(turnon) { //Ligando gmaps

      //Ligando o switch de usar ou não gmaps...
      this.gmaps_onoff = true;
      //Coloco dentro de um setTimeout(()=>{},0); para dar tempo o ngIf ligar o <div id="map">
      setTimeout(() => {
        //Se a API ainda nao foi carregada, carregar, e quando carregar tentar ligar o gmaps denovo...
        if (gMaps._mapsApi == null) {
          gMaps.carregar_api(); //La ele carrega a api e depois cria novo mapa...
          let subs = gMaps.api_loaded.subscribe(() => {
            this.turnon_gmaps(true); //Tentanto ligar o gmaps denovo
            subs.unsubscribe(); //Para nao gastar memoria...
          });
        } else {

          //Antes de criar o novo mapa, encontrando qual melhor nivel de zoom do gMaps, baseado no zoom atual do grid do kLog
          gMaps.procurar_zoom_inicial_mais_proximo(this._P.p.zoom_fator);
          //Se a api ja foi carregada, so criar novo mapa...
          gMaps.criar_novo_mapa();
          //Tambem forcar um recalculo do zoom:
          this.zoom_or_center_changed();
        }
      }, 0);

    }
    else //Desligando gmaps
    {
      this.gmaps_onoff = false;
    }

  }

  mudar_estilo_mapa(estilo : string) {
    gMaps.gmap.setMapTypeId(estilo);
  }

  prancheta_onoff = false;
  //prancheta_onoff = true; //TempDebug
  hide_map = false;

  switch_prancheta_onoff() {

    this.hide_map = false; //Resetando

    this.prancheta_onoff = !this.prancheta_onoff;

    if(this.prancheta_onoff) {
      //Configurando o resize da prancheta, depois do ngIf claro:
      setTimeout(()=>{
        $('#prancheta').resizable({
          handles: 'e',
          resize: () => { this.resetar_tamanhos_mapa() }
        });
      },0);
    }

    //Sempre que mostrar ou esconder a prancheta, resetar o tamanho do mapa, ja que o svg mudou
    setTimeout(()=>{
      //Tem que resetar depois da prancheta aparecer, pra da tempo do ngIf mostra o elemento e os tamanhos mudarem...
      this.resetar_tamanhos_mapa();
    },0);
  }

}
