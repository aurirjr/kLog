import {A} from "../app.component";
import {Node} from "../entidades/Node";
import {Edge} from "../entidades/Edge";

//Tentei fazer isso funcionar corretamente, colocando allowJs no tsconfig: https://stackoverflow.com/questions/42867688/requiring-a-javascript-node-js-module-in-typescript-allowjs-is-not-set
//import * as jsLPsolver from './../../assets/jsLPsolver.js'; // Mas deu Unreachable code detected.

//Essa tecnica que sempre uso ate funciona, o problema tava sendo so no carregamento do .js, pq esqueci alguns arquivos...
//declare var Solver: any;

//Mas acheia essa mais interessante, e acho que so carrega os arquivos quando necessario... EDIT: Nao consegui ver pelo network do chrome, talvez esteja indo junto de um bundle...
//https://stackoverflow.com/questions/27417107/how-use-an-external-non-typescript-library-from-typescript-without-d-ts
declare var require:(moduleId:string) => any;

export class Solver_PT
{

  //Problema exemplo da monografia:
  solver_pt_exemplo() {


    var SOLVER = require("./../../assets/jsLPsolver/solver");
    var results, model = [
        //Funcao Objetivo
        "min: 5 S1D1 4 S1D2 7 S1D3 2 S2D1 1 S2D2 3 S2D3",
        //Restrições
        "1 S1D1 1 S1D2 1 S1D3 <= 700",
        "1 S2D1 1 S2D2 1 S2D3 <= 2000",
        "1 S1D1 1 S2D1 = 900",
        "1 S1D2 1 S2D2 = 700",
        "1 S1D3 1 S2D3 = 1100"
      ];
    model = SOLVER.ReformatLP(model); // Reformat to JSON model
    results = SOLVER.Solve(model); // Solve the model

    console.log(results);

    //Declaração Variaveis - PARECE QUE NAO PRECISA
    //"int S1D1", "int S1D2", "int S1D3",
    //"int S2D1", "int S2D2", "int S2D3",

    //Mais ou menos como fica um problema 3x3:
    /*var results, model = [
      "min: 1 S1D1 2 S1D2 3 S1D3 2 S2D1 1 S2D2 74 S2D3 3 S3D1 2 S3D2 1 S3D3",
      "1 S1D1 1 S1D2 1 S1D3 <= 1200",
      "1 S2D1 1 S2D2 1 S2D3 <= 1000",
      "1 S3D1 1 S3D2 1 S3D3 <= 800",
      "1 S1D1 1 S2D1 1 S3D1 = 900",
      "1 S1D2 1 S2D2 1 S3D2 = 700",
      "1 S1D3 1 S2D3 1 S3D3 = 1100",
     //Declaração Variaveis - PARECE QUE NAO PRECISA
      "int S1D1", "int S1D2", "int S1D3",
      "int S2D1", "int S2D2", "int S2D3",
      "int S3D1", "int S3D2", "int S3D3",
    ];*/




  }

  //Resolver o problema do transporte, onde as origens são os nodes azuis, e o destino os nodes vermelhos
  solver_pt() {

    //Todas as infos de entrada precisam ser maior ou igual a zero, checar isso

    //Listar todos os nodes azuis e laranja
    var nodes_blue : Array<Node> = [];
    var nodes_orange : Array<Node> = [];
    for(let node of A.a._P.p.g.nodes) {
      if (node.selected_blue) {
        nodes_blue.push(node);
      } //Se tiver vermelho e azul ao mesmo tempo, considerar vermelho so se nao tiver azul...
      else if (node.selected_orange) {
        nodes_orange.push(node);
      }

      //Checando se é valido...
      if(!(node.pt_qtde_ofert_demand)) {
        A.a.output_line('Vértice '+node.nome+' não possui (PT Qtde) configurados maiores que zero! Abortado!');
        return;
      }
    }

    //Variaveis que vao formar o problema do jsLPSolver:
    var model : Array<string> = [];
    var funcao_objetivo = 'min:';
    var restricoes : Array<string> = [];
    //var variaveis : Array<string> = [];

    //Dando loop nas origens (S de supplier)
    for(var S=0; S <nodes_blue.length; S++) {

      var restricao_supplier : string = ''; //Do tipo 1 S1D1 1 S1D2 1 S1D3 <= 1200 ....

      //Dando loop nos destinos (D)
      for(var D=0; D <nodes_orange.length; D++) {

        //Vai ser fechada so depois desse loop
        restricao_supplier += ' 1 S' + (S+1) + 'D' + (D+1);

        //Procurando o edge dessa ligação, pra formar a funcao objetivo...
        for(var e of A.a._P.p.g.edges) {
          if((e.nA == nodes_blue[S] && e.nB == nodes_orange[D]) || (e.nA == nodes_orange[D] && e.nB == nodes_blue[S])) {


            //Checando se é valido...
            if(!(e.pt_custo_unit >= 0 && e.pt_custo_unit_metro >= 0)) {
              A.a.output_line('Aresta de '+e.nA.nome+' para '+e.nB.nome+' não possui custos unitários maiores ou iguais a zero! Abortado!');
              return;
            }

            //Se tiver custo unitario por metro, calculando a distancia e aumentando o custo unitario total...
            var distancia_m = Math.pow(Math.floor(Math.pow(e.nA.dist_x.n_m - e.nB.dist_x.n_m, 2) + Math.pow(e.nA.dist_y.n_m - e.nB.dist_y.n_m, 2)),1/2);

            //Montando a funcao objetivo
            funcao_objetivo += ' ' + (e.pt_custo_unit + e.pt_custo_unit_metro*distancia_m) + ' ' + 'S' + (S+1) + 'D' + (D+1);
          }
        }
      }

      restricao_supplier += ' <= ' + nodes_blue[S].pt_qtde_ofert_demand;
      restricoes.push(restricao_supplier);
    }

    //Dando loop nos destinos (D) denovo so pra colocar as restricoes
    for(var D=0; D <nodes_orange.length; D++) {

        //Restricao de demanda nao tem segredo, tem que da loop nos suppliers mesmo...
      var restricao_demanda : string = '';
      for(var SS=0; SS <nodes_blue.length; SS++) {
        restricao_demanda += ' 1 S' + (SS+1) + 'D' + (D+1);
      }
      restricao_demanda += ' = ' + nodes_orange[D].pt_qtde_ofert_demand;
      restricoes.push(restricao_demanda);
    }

    //Montando o model:
    model.push(funcao_objetivo);
    A.a.output_line("Problema LP: ");
    A.a.output_line(funcao_objetivo);
    model = model.concat(restricoes);
    A.a.output_line("Sujeito a: ");
    for(var t of restricoes) A.a.output_line(t);
    //model = model.concat(variaveis);

    //console.log(model);

    var results, SOLVER = require("./../../assets/jsLPsolver/solver");
    model = SOLVER.ReformatLP(model); // Reformat to JSON model
    results = SOLVER.Solve(model); // Solve the model

    //console.log(results);

    if(results['feasible']) {
      A.a.output_line("Problema possível! Verifique as quantidades ótimas na tabela de arestas!");

      //COLOCANDO QTDES OTIMAS NA TABELA DE ARESTAS
      //Dando loop nas origens (S de supplier)
      for(var S=0; S <nodes_blue.length; S++) {
        //Dando loop nos destinos (D)
        for(var D=0; D <nodes_orange.length; D++) {
          //Definindo nome!
          var nome = 'S' + (S+1) + 'D' + (D+1);
          //Procurando o edge dessa ligação, pra formar a funcao objetivo...
          for(var e of A.a._P.p.g.edges) {
            if((e.nA == nodes_blue[S] && e.nB == nodes_orange[D]) || (e.nA == nodes_orange[D] && e.nB == nodes_blue[S])) {
              //No json de results, a quantidade e definida pelo nome da variavel
              //Se nao tiver, é 0
              if(results[nome] != null) e.pt_qtd_otima_calculada = results[nome];
              else e.pt_qtd_otima_calculada = 0;
            }
          }
        }
      }



      A.a.output_line("Custo mínimo total: "+A.a.numberBrFormat.format(results['result']));
    } else {
      A.a.output_line("Problema impossível");
    }

    //Listar todos os nodes vermelhos

    //Fazer um loop azul com um loop vermelho dentro
    //Nesse loop, monstar a funcao objetivo

    //Retornar se a solução é possivel ou não (feaseable)

  }

}
