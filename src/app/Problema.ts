import {Graph} from "./entidades/Graph";
import {Text} from "./entidades/Text";
import {Injectable} from "@angular/core";
import {Distancia} from "./entidades/Distancia";

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
  public zoom : Distancia = new Distancia()._x_und(50,'km'); //Quantidade de metros em 83px de tela, que é o tamanho da linha verde embaixo do problema de zoom... Default é 100m / 83px
  public zoom_fator : number = this.zoom.x_m / 83; //50Km em 83px - Foi esse valor que a escala do google medeu com zoom level 8, que é o zoom level inicial

  //Controlando que posicao do mapa logico, real, esta no centro da tela
  public x_m_centro = 0; public y_m_centro = 0; //Quando der PAN, alterar esses valores

}
