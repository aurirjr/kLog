import {A} from "../app.component";
import {Node} from "../entidades/Node";
import {Edge} from "../entidades/Edge";

//IMPORTADO PELA PRIMEIRA VEZ EM SOLVER_PT
declare var require:(moduleId:string) => any;

export class Solver_PMED
{

  //Resolver o PMED, o resultado é o custo total e uma ou mais localidades que escolhidas...
  solver_pmed() {

    //Todas as infos de entrada precisam ser maior ou igual a zero, checar isso

    //Listar todos os nodes azuis e laranja
    var nodes_blue : Array<Node> = [];

    var qtd_candidadtos : number = 0;

    for(let node of A.a._P.p.g.nodes) {
      if (node.selected_blue) {
        nodes_blue.push(node);
      }

      //Checando se é valido...
      if(!(node.cog_rate > 0 && node.cog_vol > 0)) {
        A.a.output_line('Vértice '+node.nome+' não possui Vol/Taxa configurados maiores que zero! Abortado!');
        return;
      }

      //Definindo os nodes candidatos, que são aqueles com custo fixo maior que zero
      if(node.pmed_custofixo > 0) qtd_candidadtos++;
    }

    //A quantidade de candidatos precisa ser maior ou igual a quantidade de nodes que se deseja encontrar:
    if(qtd_candidadtos < A.a._P.p.loc_qtd_centros) {
      A.a.output_line('No PMED, a quantidade de vértices candidatos precisa ser maior ou igual a quantidade de centros que se deseja encontrar! Abortado!');
      A.a.output_line('Um vértice candidato precisa ter custo fixo maior que zero na tabela de vértices!');
      return;
    }



    //Variaveis que vao formar o problema do jsLPSolver:
    var model : Array<string> = [];
    var funcao_objetivo = 'min:';
    var restricoes : Array<string> = [];
    //var variaveis : Array<string> = [];

    //O problema modelado em PMED, na funcao objetivo, combina TODOS os vértices, dois a dois, com as possiveis origens ( candidados )
    for(var C = 0; C < nodes_blue.length; C++) {
      //Pra cada node candidato, dar loop em todos os outros... Nao precisa dele mesmo, ja que a distancia é 0
      for(var N = 0; N < nodes_blue.length; N++) {
        if(C == N) continue; //Nao precisa dele mesmo, ja que a distancia é 0

        //Multiplicando distancia por taxa e volume, que sera o coefieicnete da variavel K. A variavel K assume 0 ou 1.
        //A taxa utilizada, eu considerei do candidato. Agora o volume, no artigo do RodolfoLisitaPinto, é o do destino. Então N.
        var coef = nodes_blue[C].cog_rate * nodes_blue[N].cog_vol
          * Math.pow(Math.floor(Math.pow(nodes_blue[C].dist_x.n_m - nodes_blue[N].dist_x.n_m, 2) + Math.pow(nodes_blue[C].dist_y.n_m - nodes_blue[N].dist_y.n_m, 2)),1/2); //Distancia

        funcao_objetivo += ' ' + (coef || 0) + ' ' + 'C' + (C+1) + 'N' + (N+1);
      }

      //Adicionando o custo de escolher esse node como origem:
      //Eu supus, que como SUM Xii = p (qtde_pontos) entao cada Xii indica se escolheu ou nao certamente uma localidade como centro de disitrbuicao.
      funcao_objetivo += ' ' + (nodes_blue[C].pmed_custofixo || 0) + ' ' + 'C' + (C+1) + 'N' + (C+1);
    }

    //Restricoes

    //Restricao de SUM Xij = 1, para todo i qualquer que seja o j.
    //SIGNIFICA QUE CADA DESTINO SO TEM UMA ORIGEM!
    var restricao_sum_xij : string = '';

    for(var N = 0; N < nodes_blue.length; N++) {
      for(var C = 0; C <nodes_blue.length; C++) {
        restricao_sum_xij +=' 1 C' + (C+1) + 'N' + (N+1);
      }
      //Restricao de SUM Xij = 1, para todo i qualquer que seja o j.
      restricoes.push(restricao_sum_xij + ' = 1');
      restricao_sum_xij = '';
    }

    //Restricao de SUM Xii = p
    //É ISSO QUE LIMITA O NUMERO DE ORIGENS, n entendi pq, mas vi no artigo... é o que define o numero de centros...
    var restricao_sum_xii : string = '';
    for(var C = 0; C <nodes_blue.length; C++) { restricao_sum_xii += ' 1 C' + (C+1) + 'N' + (C+1); }
    restricoes.push(restricao_sum_xii + ' = ' +A.a._P.p.loc_qtd_centros);

    //Restricao Xij <= Xjj, qualquer que seja i e j
    for(var C = 0; C <nodes_blue.length; C++) {
      for(var N = 0; N < nodes_blue.length; N++) {
        //Nao precisa quando C=N...
        if(N!=C) restricoes.push(' 1 C' + (C+1) + 'N' + (N+1) + ' -1 ' + 'C' + (C+1) + 'N' + (C+1) + " <= 0");
      }
    }

    //Garantindo que somente os candidatos serão escolhidos:
    for(var N = 0; N < nodes_blue.length; N++) {
      if(!(nodes_blue[N].pmed_custofixo > 0)) //Esse é um node que nao deve ser escolhido como origem
        restricoes.push('1 C'+(N+1)+'N'+(N+1)+' = 0');
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
      A.a.output_line("Problema possível! As localidades e conexões estão destacadas de vermelho!");

      //Removendo todas as selecoes laranja...
      for(let node of A.a._P.p.g.nodes) {
        node.set_select('selection_orange',false);
      }
      for(let edge of A.a._P.p.g.edges) {
        edge.set_select('selection_orange',false);
      }

      //Destacando os nodes:
      for(var C = 0; C < nodes_blue.length; C++) {
        //Se for encontrado o CxNx dele como 1, entao foi escolhido!
        if(results['C'+(C+1)+'N'+(C+1)] == 1) {

          nodes_blue[C].set_select('selection_orange', true);

          //Conectando com os nodes que serão ligados com esse, se ja nao existir conexão...
          for(var N = 0; N < nodes_blue.length; N++) {
            if(C == N) continue; //Nao precisa dele mesmo, nao tem edge dele pra ele...

            //Se deve conectar com a origem, entao isso vai ser 1...
            if(results['C'+(C+1)+'N'+(N+1)] == 1) {

              //Pressuponho false...
              var encontrado_edge = false;

              //Procurando nos edges...
              for(var e of A.a._P.p.g.edges) {
                if((e.nA == nodes_blue[C] && e.nB == nodes_blue[N]) || (e.nA == nodes_blue[N] && e.nB == nodes_blue[C])) {

                  //Encontrado node, entao destacar com orange:
                  e.set_select('selection_orange',true);

                  encontrado_edge = true;
                  break;
                }
              }

              //Se nao encontrou um edge, entao criar e destacar
              if(!encontrado_edge) {
                var edge = new Edge()._nA(nodes_blue[C])._nB(nodes_blue[N]);
                A.a._P.p.g.edges.push(edge);
                edge.set_select('selection_orange',true);
              }
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
