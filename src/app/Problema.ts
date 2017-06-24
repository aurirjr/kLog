import {Graph} from "./entidades/Graph";
import {Text} from "./entidades/Text";
import {Injectable} from "@angular/core";
import {Distancia} from "./entidades/Distancia";
import {Node} from "./entidades/Node";

@Injectable()
export class ProblemaService{

  //Comeca com um problema default, que pode ser alterado
  //PROBLEMA ATUAL! Chamado de p por motivos de simplificação de acesso das variáveis...
  public p : Problema = new Problema();

}

export class Problema{

  //Deve fazer parte do problema tudo aquilo que será salvo, continuando depois de onde parou, incluindo:
  //Posição do pan e zoom.
  //Status fdo gmap
  //Nodes, edges, textos e quaisquer elementos da tela

  constructor() {
    //Instanciando
    this.g._nodes([]);
    this.g._edges([]);
  }

  public titulo : string = "Problema";
  public g: Graph = new Graph();
  public svg_texts : Array<Text> = [];

  //Controle de zoom
  public zoom : Distancia = new Distancia()._n_und(50,'km'); //Quantidade de metros em 83px de tela, que é o tamanho da linha verde embaixo do problema de zoom... Default é 100m / 83px
  public zoom_fator : number = this.zoom.n_m / 83; //50Km em 83px - Foi esse valor que a escala do google medeu com zoom level 8, que é o zoom level inicial

  //Controlando que posicao do mapa logico, real, esta no centro da tela
  public x_m_centro = 0; public y_m_centro = 0; //Quando der PAN, alterar esses valores

  //Todo novo problema vai usar isso como referencia para dar nomes aos nodes adicionados...
  public n_counter=1;
  public set_random_name(node : Node):Node {
    node.nome = 'N'+this.n_counter;
    this.n_counter++;
    return node; //Builder Pattern
  }

  //COnfiguração da prancheta:
  pran_cfg_show_x_y : boolean = true;
  pran_cfg_show_lat_lng : boolean = true;
  pran_cfg_show_params_loc : boolean = false;
  pran_cfg_show_params_pro_tranp : boolean = false;
  pran_cfg_show_params_loc_pmed : boolean = false;

  //Problema de localização
  loc_qtd_centros : number = 1; //Default é 1
  loc_power_factor : number = 0.5; //ToDo: Ainda to decidindo se uso ou nao, por enquanto nao influi nada...
  loc_precisao : number = 0.00001; //Default na iteraço
  loc_usar_alg_tipo : number = 0; //Default é 0

  //Salvando o texto de output no problema, pode ser bem util
  output_text = "";

}
