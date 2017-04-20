//using Microsoft.SolverFoundation.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace kLogApp
{
    public class Solvers
    {
        //## ESTATUTO GERAL 1 ## Qualquer ponto/node tera uma precisao de ate quatro casas decimais de metro e nada mais
        //## ESTATUTO GERAL 2 ## Qualquer distancia tera uma precisao de ate quatro casas decimais de metro e nada mais
        //## ESTATUTO GERAL 3 ## Qualquer valor monetario tera uma precisao de ate cinco casas decimais e nada mais

        #region Centro de Gravidade

        public class PontoXY
        {
            public double x;
            public double y;
            public double vol_rate; //Nao considerar vol e rate separado, juntar tudo, multiplicando, fazendo um vol_rate...
            public List<Node> nodes_clusterizados;
        }

        //Pag 437 Ballou
        //Centro de gravidade - Nodes, numero de cgs, power factor
        //Algoritmo proprio baseado em http://www.stellingconsulting.nl/SC_centersofgravity.html
        //somente_calcular_silent é para ser usado pela funcao de MULTICOG e nao enviar nada para o output. As checagens sao feita no multicog.
        static public void COG_Otimo_GUI(List<Node> nodes, double power_factor, decimal precisao, bool conectar_resultados)
        {
            //Checks de validacao...
            //TODO: LIMITAR POWER FACTOR DE 0 ( excluso ) a 2, se nao, messagebox
            foreach (var node in nodes)
            {
                //Checar se alguma taxa ou volume é 0.
                if (node.cog_rate == 0)
                {
                    App.MW.alertar(1, "Atenção!", "O vértice " + node.texto_para_output() + " tem Taxa 0 como parâmetro do centro de gravidade!");
                    return;
                }
                if (node.cog_vol == 0)
                {
                    App.MW.alertar(1, "Atenção!", "O vértice " + node.texto_para_output() + " tem Volume 0 como parâmetro do centro de gravidade!");
                    return;
                }
            }

            double X;
            double Y;

            //Step 2 - Calculando ponto inicial
            X = nodes.Sum(n => n.cog_vol * n.cog_rate * n.x) / nodes.Sum(n => n.cog_vol * n.cog_rate);
            X = Math.Floor(X * 1000) / 1000; //Estatuto 1
            Y = nodes.Sum(n => n.cog_vol * n.cog_rate * n.y) / nodes.Sum(n => n.cog_vol * n.cog_rate);
            Y = Math.Floor(Y * 1000) / 1000; //Estatuto 1

            //Step 3 - Calulando novos X e Y em funcao dos anteriores...
            int k = 0;
            decimal valor_anterior = 0;
            decimal valor_atual = 0;
            decimal melhoria = 0;
            while (true)
            {
                k++;
                if (k > 200) break; //Por garantia, coloco esse k no maximo em 200... pra nao ficar infinito em erros...

                //Imprimindo as informacoes e checando se pode parar...
                valor_atual = Cog_TC(nodes, power_factor, X, Y);

                if (valor_anterior != 0) melhoria = valor_atual / valor_anterior - 1;

                App.MW.OUT("Custo Total em ( " + String.Format("{0:0.0000}", X) + " ; " + String.Format("{0:0.0000}", Y) + " ) é de $" + String.Format("{0:###,###,##0.00}", valor_atual)
                    + ((melhoria != 0) ? " ( " + String.Format("{0:0.00########}%", melhoria * 100) + " )" : ""));

                if (valor_anterior != 0 && Math.Abs(melhoria) < precisao) break;

                valor_anterior = valor_atual;

                //Agora sim, passos que calculam:

                double tempX = X;
                double tempY = Y;

                //Tem um calculo a mais aqui, o "di" sendo calculado duas vezes... mas tudo bem...
                X = nodes.Sum(n => n.cog_vol * n.cog_rate * n.x / Math.Pow((Math.Pow(n.x - tempX, 2) + Math.Pow(n.y - tempY, 2)), power_factor))
                    / nodes.Sum(n => n.cog_vol * n.cog_rate / Math.Pow((Math.Pow(n.x - tempX, 2) + Math.Pow(n.y - tempY, 2)), power_factor));
                X = Math.Floor(X * 1000) / 1000; //Estatuto 1
                Y = nodes.Sum(n => n.cog_vol * n.cog_rate * n.y / Math.Pow((Math.Pow(n.x - tempX, 2) + Math.Pow(n.y - tempY, 2)), power_factor))
                    / nodes.Sum(n => n.cog_vol * n.cog_rate / Math.Pow((Math.Pow(n.x - tempX, 2) + Math.Pow(n.y - tempY, 2)), power_factor));
                Y = Math.Floor(Y * 1000) / 1000; //Estatuto 1

                //    foreach (var n in nodes)
                //    {
                //        var di = Math.Pow((Math.Pow(n.x - X, 2) + Math.Pow(n.y - Y, 2)), power_factor);
                //        tempX += (n.cog_vol * n.cog_rate * n.x / di)
                // Percebi que teria que fazer um tempX para o numerador e outro pro denominador, entao 4 variaveis temp...

                //    }
                //}
            }

            var node_result = new Node();

            node_result.x = X;
            node_result.y = Y;

            node_result.preparar_GUI();
            node_result.Label = "CG";

            App.MW.geral.grafo.Nodes.Add(node_result);

            if (conectar_resultados)
            {
                //Se vai conectar resultados, ligar todos os nodes ao node do CG
                foreach (var n in nodes) App.MW.geral.grafo.Edges.Add(new Edge(node_result, n, 0));
            }

            App.MW.redraw_MapaWin();

            App.MW.OUT("...");
        }

        //Custo total de um cog, conforme formula do manual do LOGWARE
        public static decimal Cog_TC(List<Node> nodes, double power_factor, double x, double y)
        {

            /* DEBUG
            //decimal sum = 0;
            //double distancia;

            //foreach (var n in nodes)
            //{
            //    distancia = Math.Pow(n.x - x, 2) + Math.Pow(n.y - y, 2);

            //    Console.WriteLine("Distancia: "+ distancia);
            //    Console.WriteLine("Volrate: "+ (n.cog_rate_gui * n.cog_vol_gui));
            //    Console.WriteLine("Calc: " + Math.Pow(n.cog_rate_gui * n.cog_vol_gui * distancia, power_factor));

            //    sum += (decimal)(Math.Pow(n.cog_rate_gui * n.cog_vol_gui *distancia, power_factor));
            //}

            //var xxxx = Math.Floor((
            //    sum
            //) * 1000) / 1000; //Estatuto 2


            //return xxxx; 
            */

            return
                Math.Floor((
                    (decimal)nodes.Sum(n =>
                    n.cog_rate_gui * n.cog_vol_gui * Math.Pow(
                    Math.Floor(Math.Pow(n.x - x, 2) + Math.Pow(n.y - y, 2) * 1000) / 1000 //Estatuto 2, evita Value was either too large or too small for a Decimal.
                    , power_factor))
                ) * 1000) / 1000; //Estatuto 3
        }

        static public PontoXY COG_Cluster(List<PontoXY> pontos, double power_factor, decimal precisao)
        {

            double X;
            double Y;

            //Step 2 - Calculando ponto inicial
            X = pontos.Sum(p => p.vol_rate * p.x) / pontos.Sum(p => p.vol_rate);
            X = Math.Floor(X * 1000) / 1000; //Estatuto 1
            Y = pontos.Sum(p => p.vol_rate * p.y) / pontos.Sum(p => p.vol_rate);
            Y = Math.Floor(Y * 1000) / 1000; //Estatuto 1

            //Step 3 - Calulando novos X e Y em funcao dos anteriores...
            int k = 0;
            double valor_anterior = 0;
            double valor_atual = 0;
            while (true)
            {
                k++;
                if (k > 200) break; //Por garantia, coloco esse k no maximo em 200... pra nao ficar infinito em erros...

                //Imprimindo as informacoes e checando se pode parar...
                valor_atual = pontos.Sum(n => n.vol_rate * Math.Pow((Math.Pow(n.x - X, 2) + Math.Pow(n.y - Y, 2)), power_factor));

                //Debug
                App.MW.OUT("  --> Calculando COG: X " + X + " Y " + Y + " ComTC: " + valor_atual);

                if (valor_anterior != 0 && Math.Abs(valor_atual / valor_anterior - 1) < (double)precisao) break;

                valor_anterior = valor_atual;

                //Agora sim, passos que calculam:

                double tempX = X;
                double tempY = Y;

                //Tem um calculo a mais aqui, o "di" sendo calculado duas vezes... mas tudo bem...
                X = pontos.Sum(n => n.vol_rate * n.x / Math.Pow((Math.Pow(n.x - tempX, 2) + Math.Pow(n.y - tempY, 2)), power_factor))
                    / pontos.Sum(n => n.vol_rate / Math.Pow((Math.Pow(n.x - tempX, 2) + Math.Pow(n.y - tempY, 2)), power_factor));
                X = Math.Floor(X * 1000) / 1000; //Estatuto 1
                Y = pontos.Sum(n => n.vol_rate * n.y / Math.Pow((Math.Pow(n.x - tempX, 2) + Math.Pow(n.y - tempY, 2)), power_factor))
                    / pontos.Sum(n => n.vol_rate / Math.Pow((Math.Pow(n.x - tempX, 2) + Math.Pow(n.y - tempY, 2)), power_factor));
                Y = Math.Floor(Y * 1000) / 1000; //Estatuto 1
            }

            var novo_conjunto_nodes_clusterizados = new List<Node>();
            foreach (var node in pontos) novo_conjunto_nodes_clusterizados.AddRange(node.nodes_clusterizados);

            //Retornar um novo node com o vol_rate somado dos outros 2...
            return new PontoXY() { x = X, y = Y, vol_rate = pontos.Sum(n => n.vol_rate), nodes_clusterizados = novo_conjunto_nodes_clusterizados };
        }

        //Tecnicas de clustering em grafo. Muito obrigado a: https://www.scribd.com/doc/200725616/Ballou-Logistics-Solved-Problems-Chapter-13
        //There are as many clusters as there are points, which are 10 in this case.
        //The closest points are found and replaced with a single point with the combined volume located at the center of gravity point.There is now one less cluster.
        //The next closest two points/clusters are found, and they are further combined and located at their center of gravity.
        //The process continues until only two clusters remain. The centers of gravity for these two clusters will be the desired clinic locations
        static public void MULTICOG_Clustering(List<Node> nodes, double power_factor, decimal precisao, int num_cgs, bool conectar_resultados)
        {
            //TODO: LIMITAR POWER FACTOR DE 0 ( excluso ) a 2, se nao, messagebox

            //Checks
            foreach (var node in nodes)
            {
                //Checar se alguma taxa ou volume é 0.
                if (node.cog_rate == 0)
                {
                    App.MW.alertar(1, "Atenção!", "O vértice " + node.texto_para_output() + " tem Taxa 0 como parâmetro do centro de gravidade!");
                    return;
                }
                if (node.cog_vol == 0)
                {
                    App.MW.alertar(1, "Atenção!", "O vértice " + node.texto_para_output() + " tem Volume 0 como parâmetro do centro de gravidade!");
                    return;
                }
            }

            //Check
            if (num_cgs > nodes.Count())
            {
                App.MW.alertar(1, "Atenção!", "O numeros de CGs é maior que o número de vértices!");
                return;
            }

            //Transformando os nodes em PontoXY

            List<PontoXY> pontos = new List<PontoXY>();

            foreach (var node in nodes)
            {
                List<Node> lista_node_respectivo = new List<Node>(); //Inicialmente essa lista so contem o proprio node transformado em pontoXY
                lista_node_respectivo.Add(node);
                pontos.Add(new PontoXY() { x = node.x, y = node.y, vol_rate = node.cog_vol * node.cog_rate, nodes_clusterizados = lista_node_respectivo });
            }

            //Calculando distancias inicias

            List<Distancia> distancias = new List<Distancia>();

            for (int k = 0; k < (pontos.Count - 1); k++) //Perceba o -1, para nao calcular n com n...
            {
                for (int kk = k + 1; kk < pontos.Count; kk++)
                {
                    Console.WriteLine("Adicionando " + k + " " + kk);

                    var lista = new List<PontoXY>();
                    lista.Add(pontos[k]);
                    lista.Add(pontos[kk]);

                    //Distancia entre k e kk. Assim sempre calcula so uma vez...
                    distancias.Add(new Distancia() {
                        pontos = lista,
                        distancia = Math.Floor(
                            Math.Pow((Math.Pow(pontos[k].x - pontos[kk].x, 2) + Math.Pow(pontos[k].y - pontos[kk].y, 2)), power_factor)
                            * 1000) / 1000 //Estatuto 2
                    });
                }
            }

            //Loop

            while (pontos.Count > num_cgs) //No ponto que os pontos forem o numero de cgs, entao tudo foi clusteado...
            {
                //Buscando a menor distancia:
                Distancia menor_distancia = null;
                foreach (var d in distancias) if (menor_distancia == null || d.distancia < menor_distancia.distancia) menor_distancia = d;

                //DEBUG
                App.MW.OUT("Menor distancia: " + menor_distancia.distancia + " em " + menor_distancia.pontos[0].x + " "
                    + menor_distancia.pontos[0].y + " para " + menor_distancia.pontos[1].x + " " + menor_distancia.pontos[1].y); //DELETE

                //Removendo os pontos da menor distancia da lista de pontos e distancia. É como se os pontos sumissem, so tao em menor_distancia
                foreach (PontoXY p in menor_distancia.pontos)
                {
                    App.MW.OUT(" Removendo o ponto " + p.x + " " + p.y + " com " + p.vol_rate); //DEBUG
                    pontos.Remove(p); //Removendo os pontos
                    foreach (Distancia d in distancias.Where(d => d.pontos.Contains(p)).ToList()) distancias.Remove(d); //Removendo qualquer distancia com esse ponto...
                }

                //Clusterizando a menor distancia...
                var novo_ponto = COG_Cluster(menor_distancia.pontos, power_factor, precisao);

                //DEBUG
                App.MW.OUT("Novo ponto: " + novo_ponto.x + " " + novo_ponto.y + " com " + novo_ponto.vol_rate); //DELETE

                //Para envitar provlemas de 'System.OverflowException', limitando qualquer posicao de node em 3 casas decimais do metro...
                novo_ponto.x = Math.Floor(novo_ponto.x * 1000) / 1000;
                novo_ponto.y = Math.Floor(novo_ponto.y * 1000) / 1000;

                //Criando novas distancias entre esse ponto e todos os outros:
                foreach (var p in pontos) //Pontos ainda nao tem o ponto novo...
                {
                    var lista = new List<PontoXY>();
                    lista.Add(novo_ponto);
                    lista.Add(p);

                    distancias.Add(new Distancia()
                    {
                        pontos = lista,
                        distancia = Math.Floor(
                            Math.Pow((Math.Pow(p.x - novo_ponto.x, 2) + Math.Pow(p.y - novo_ponto.y, 2)), power_factor)
                            * 1000) / 1000 //Estatuto 2
                    });
                }

                //Adicionando o novo ponto, clusterizado.
                pontos.Add(novo_ponto);
            }

            //Se chegou aqui, o clusteamento chegou ao fim.
            //Criar os nodes dos COG para jogar na GUI

            //foreach (PontoXY p in pontos)
            //{
            //  COG_Otimo_GUI(p.nodes_clusterizados, power_factor, precisao, conectar_resultados);
            //}

            App.MW.OUT("Resultado: ");
            foreach (var p in pontos) { App.MW.OUT("CG: " + p.x + " " + p.y + " com " + p.vol_rate);

                foreach (var n in p.nodes_clusterizados)
                {
                    App.MW.OUT("  - Membro:" + n.Label);
                }
            }

        }

        class Distancia
        {
            public List<PontoXY> pontos; //Sempre vai ter dois pontos
            public double distancia;
        }

        #region MULTICOG que nao deu certo
        //O multicog abaixo usa a tecnica do ballou pagina 442 e do site - MAS AS VEZES DA O RESULTADO CORRETO, AS VEZES NAO!!
        /*
        static public void MULTICOG_ComProblemas(List<Node> nodes, double power_factor, decimal precisao, int num_cgs, bool conectar_resultados)
        {

            //Ballou 442
            //So possivel gracas a: http://www.stellingconsulting.nl/SC_centersofgravity.html

            //Checks de validacao...
            foreach (var node in nodes)
            {
                //Checar se alguma taxa ou volume é 0.
                if (node.cog_rate == 0)
                {
                    App.MW.alertar(1, "Atenção!", "O vértice " + node.texto_para_output() + " tem Taxa 0 como parâmetro do centro de gravidade!");
                    return;
                }
                if (node.cog_vol == 0)
                {
                    App.MW.alertar(1, "Atenção!", "O vértice " + node.texto_para_output() + " tem Volume 0 como parâmetro do centro de gravidade!");
                    return;
                }
            }

            //Check
            if (num_cgs > nodes.Count())
            {
                App.MW.alertar(1, "Atenção!", "O numeros de CGs é maior que o número de vértices!");
                return;
            }

            //ENCONTREI A MESMA IDEIA NO BALLOU pag 442

            //MULTICOG consiste basicamente em combinar todos os k nodes em n cogs.
            //Existem portanto, k, n a n combinacoes posiveis.
            //Testar todas elas é uma opcao, mas para muitos pontos e cogs pode demorar bastante.

            //O algoritmo que encontrei no site é:
            //Escolher duas combinacoes quaisquer de todos os nodes para serem os CG iniciais.
            //Calcular o TC.
            //Recalcular uma nova combinacao, baseada na distancia ( menor possivel ) para cada node, em relacao os CGS anteriores.
            //Recalcular o TC.
            //Se o novo somatorio for menor, entao a nova combinacao passa a ser melhor possivel.

            //Preparando a variavel onde fica a combinacao... Cada node associado a um inteiro que é uma representacao do cg...
            Dictionary<Node, int> combinacoes = new Dictionary<Node, int>();

            //Escolher uma combinacao, aleatoriamente, como primeira combinacao.
            //Para garantir que nenhum K vai ficar sem node, adicionar os K primeiros quase manualmente, sem random...

            int kk = num_cgs - 1;

            Random rnd = new Random();
            foreach (var node in nodes)
            {
                if (kk >= 0) //Exemplo: 2 CGS vai de 1 a 0.
                {
                    combinacoes.Add(node, kk);
                    kk--;
                }
                else
                {
                    //Depois de garantir que existe no minimo 1 elemento para cada k, ai pode colocar random...
                    combinacoes.Add(node, rnd.Next(0, num_cgs));
                }
            }

            //Cada combinacao, gera um CGs.
            Dictionary<int, Result_COG_PontoXY_TC> CGs = new Dictionary<int, Result_COG_PontoXY_TC>();
            for (int k = 0; k < num_cgs; k++) CGs.Add(k, COG_Otimo(true, combinacoes.Where(x => x.Value == k).Select(x => x.Key).ToList(), power_factor, precisao, false));

            while (true)
            {
                //RECOMBINANDO PELA MENOR DISTANCIA DE CADA NODE AO CG MAIS PROXIMO
                //Agora vamos ver, para cada node, se existe um CG mais proximo que o atualmente associado.
                //Se existir, recombinar, depois novo cgs e nova checagem...
                bool recalcular_cgs = false;
                Dictionary<int, double> temp_distancia = new Dictionary<int, double>();
                foreach (var kvp in combinacoes.ToList()) //Transformo em lista para da interacao sem erro de collection was modified...
                {
                    temp_distancia.Clear();
                    //Checando se mantem a associacao com esse CG ou se passa pra outro. Se passar, entao precisa recalcular os CGs...
                    for (int k = 0; k < num_cgs; k++)
                    {
                        temp_distancia.Add(k, Math.Pow((Math.Pow(kvp.Key.x - CGs[k].x, 2) + Math.Pow(kvp.Key.y - CGs[k].y, 2)), power_factor));
                    }

                    //Checando a menor distancia:
                    var menor_k = temp_distancia.Aggregate((l, r) => l.Value < r.Value ? l : r).Key; //http://stackoverflow.com/questions/23734686/c-sharp-dictionary-get-the-key-of-the-min-value

                    if (menor_k != kvp.Value) recalcular_cgs = true;

                    combinacoes[kvp.Key] = menor_k; //Sempre associar com a menor distancia
                }

                //Se nao precisa recalcular_cgs, entao cabo
                if (recalcular_cgs == false) break;
                else
                {   //Nesse caso, recalcular os CGs e entrar no loop novamente...
                    CGs.Clear();
                    for (int k = 0; k < num_cgs; k++) CGs.Add(k, COG_Otimo(true, combinacoes.Where(x => x.Value == k).Select(x => x.Key).ToList(), power_factor, precisao, false));
                }
            }


            //Configurando GUI:

            for (int k = 0; k < num_cgs; k++)
            {
                var node = new Node();

                node.x = CGs[k].x;
                node.y = CGs[k].y;

                node.preparar_GUI();
                node.Label = "CG " + (k + 1);

                App.MW.geral.grafo.Nodes.Add(node);

                if (conectar_resultados)
                {
                    //Se vai conectar resultados, ligar todos os nodes ao node do CG
                    foreach (var n in combinacoes.Where(x => x.Value == k).Select(x => x.Key)) App.MW.geral.grafo.Edges.Add(new Edge(node, n, 0));
                }

                App.MW.OUT("Total CG " + (k + 1) + " : $" + String.Format("{0:###,###,##0.00}", CGs[k].TC));
            }

            App.MW.OUT("Total Geral : $" + String.Format("{0:###,###,##0.00}", CGs.Values.Sum(cg => cg.TC)));

            App.MW.redraw_MapaWin();

            App.MW.OUT("...");
        } 
        */
        #endregion

        #endregion

        #region ROUTER

        //Dijkstra Conforme apostilas do Anselmo "Pesquisa_Operacional_Aula_16_Otimização em redes_Caminho mínimo e caixeiro viajante"

        class Dijkstra_Rotulo
        {
            public Node node; //Node que tem esse rotulo
            public Double? u; //Distancia total ate esse rotulo. Pode ser indefinido.
            public Node pred; //Predecessor.
            public bool permanente = false; //Se false é temporario
        }

        //Retorna um PATH, representado por um caminho de Edge
        //Utilizado em ROUTE
        public static Path find_best_route_Dijkstra(Graph graph, Node A, Node B)
        {
            //Para o Path resultado
            var nodes_resultado = new List<Node>();
            var edges_resultado = new List<Edge>();

            //Antes de comecar o Dijkstra, eu preciso considerar somentes todo e qualquer node que:
            //Tem caminho ate A & Tem caminho ate B

            //Para tanto, eu faco um greedy, a partir do node A, e outro, a partir do node B.
            //Com isso, levanto tos os nodes do grafo que sao acessiveis para A, e depois para B.
            //Faco a uniao desse conjunto, tendo entao os nodes interessantes para o Dijkstra

            //ATENCAAAO!
            //Antes de calcular o reachables do B, ver se o B esta nos reachables do A
            //Esse check é importante, pq se nao tiver, ja pode parar o algortimo.

            //Depois eu pego a interseção, pq isso vai deixar o Dijsktra muito mais rapido, sem necessidade de calcular uma porrada de node...

            //Usando avoid, evito varios pontos sem necessidae... pq faco um greed de todos os pontos a partir de B sem passar por A.
            //E todos os pontos a partir de A sem passar por B. A intereseçao é todos os pontos dos caminhos possiveis entre A e B.

            //EDIT:
            //Pensei que isso me retornaria todos os PATHS, mas estava errado!!
            //http://stackoverflow.com/questions/9535819/find-all-paths-between-two-graph-nodes


            //EDIT: So existe uma situação onde a interseção abaixo nao vai retornar nada erronemanente. É quando tiver um caminho direto entre A e B.
            var unico_edge = graph.Edges.Where(e => (e.nA == A && e.nB == B) || (e.nA == B && e.nB == A)).FirstOrDefault();

            if (unico_edge != null)
            {
                nodes_resultado.Add(unico_edge.nA);
                nodes_resultado.Add(unico_edge.nB);
                edges_resultado.Add(unico_edge);
                return new Path(nodes_resultado, edges_resultado);
            }

            //DEIXEI O AVOID, pois traz uma melhoria minima... vai que a partir de B tem alguns nodes, nao precisa ver pro lado de la ou pro lado de ca...
            var avoid = new List<Node>();
            avoid.Add(A); //COMENTADO
            avoid.Add(B);

            List<Node> todos_os_nodes_acessiveis_por_A = reachable_nodes_greedy(graph, A, avoid);
            List<Node> todos_os_nodes_acessiveis_por_B = reachable_nodes_greedy(graph, B, avoid); //COMENTADO

            //Se ao interceder nao retornar nenhum node, entao nao existe caminho possivel... //COMENTADO
            List<Node> nodes_Problema = todos_os_nodes_acessiveis_por_A.Intersect<Node>(todos_os_nodes_acessiveis_por_B).ToList(); //COMENTADO

            //A checagem podia ser assim:
            //if (!todos_os_nodes_acessiveis_por_A.Contains(B)) return null; //Deixei a checagem mesmo, que é o mais importante ...

            //Mas deixei assim:
            if (nodes_Problema.Count == 0) return null; //Nao existe path possivel...

            //Adicionando manualmente o node A e B, pq os codigos acima nao adicionam A e B...
            nodes_Problema.Add(A);
            nodes_Problema.Add(B);

            //Transformando os nodes em rotulos de Dijkstra
            var rotulos = new Dictionary<Node,Dijkstra_Rotulo>();

            //Preciso tambem dos edges do problema, para saber todos os nodes vizinhos de outro...
            List<Edge> edges_Problema = graph.Edges.Where(e => nodes_Problema.Contains(e.nA) || nodes_Problema.Contains(e.nB)).ToList();

            //Criando rotulos para todos os nodes, inclusive B
            foreach (Node n in nodes_Problema) rotulos.Add(n, new Dijkstra_Rotulo { node = n }); //Ja é, por default, pemamnente facil, u null e pred null

            rotulos[A].permanente = true;
            rotulos[A].u = 0;

            //RODANDO DIJKSTRA:
            Node atual = A;

            while(atual != null)
            {
                //DEBUG - Analisar com breakpoint
                //var vizinhos = edges_Problema.Where(e => e.nA == atual || e.nB == atual).Select(e => (e.nA == atual) ? e.nB : e.nA).ToList();

                //Marcando os vizinhos do atual
                foreach (var vizinho in edges_Problema.Where(e => e.nA == atual || e.nB == atual).Select(e => (e.nA == atual) ? e.nB : e.nA))
                {
                    //E pra pegar um vizinho somente se ele for node do problema... se nao num tem necessidade...
                    if (!nodes_Problema.Contains(vizinho)) continue;

                    //Somando a distancia do vizinho ao rotulo atual
                    var u_candidato = rotulos[atual].u + Math.Pow(Math.Pow(atual.x - vizinho.x, 2) + Math.Pow(atual.y - vizinho.y, 2), 0.5);

                    //O u sendo null é minha versao de infinito... se for, qualquer coisa é melhor..
                    if (rotulos[vizinho].u == null || u_candidato < rotulos[vizinho].u)
                    {
                        rotulos[vizinho].u = u_candidato;
                        rotulos[vizinho].pred = atual;
                    }
                }

                //DEBUG - Analisar com breakpoint
                //var nao_permanentes = rotulos.Where(kvp => kvp.Value.permanente == false && kvp.Value.u != null).ToList();

                //Procurando agora o no, temporario, de menor u. Ele vira permanente e passa a ser o atual.
                //No momento que nao houver temporarios, acabar o loop

                atual = null;
                foreach(var kvp in rotulos.Where(kvp => kvp.Value.permanente == false && kvp.Value.u != null)) //Nao pode ser infinito, um infinito nunca vai ser o atual... pq os vizinhos sempre tem u...
                {
                    if (atual == null) atual = kvp.Key;
                    else
                    {
                        if (kvp.Value.u < rotulos[atual].u) atual = kvp.Key; //Escolhendo o node com menor u
                    }
                }

                if (atual != null) rotulos[atual].permanente = true; //Tornando o atual permanente!

                //Se passar daqui, entao é pq nao achou nenhum temporario. Assim, vai null para o while, e ele sai...
            }

            //Calculando o PathN resultado.

            //Agora, de traz pra frente, vai montando o PathN...

            var node_final = B; //Vai começar pelo B, o final

            //Agora vai inserir B e pegar o predecessor. Quando o predecessor for o A, parar
            while (true)
            {
                nodes_resultado.Insert(0, node_final); //Mantendo a ordem... vai empurrando pra frente os que foram adicionado primeiro
                edges_resultado.Insert(0,edges_Problema.Where(e => (e.nA == node_final && e.nB == rotulos[node_final].pred) || (e.nB == node_final && e.nA == rotulos[node_final].pred)).First());

                if (rotulos[node_final].pred == A) break;

                node_final = rotulos[node_final].pred;
            }

            nodes_resultado.Insert(0, A); //Inserir o A manualmente

            return new Path(nodes_resultado, edges_resultado);
        }

        //Usado por find_best_route_Dijkstra. É um greedy para encontrar todos os nodes do grafo acessiveis por um certo node...
        //Contando que esse acesso nao passe por um node da lista Avoid...
        //Util no Dijkstra para evitar que se passe por varios caminhos inuteis que jamais levariam entre um ponto A e B
        public static List<Node> reachable_nodes_greedy(Graph g, Node nK, List<Node> Avoid)
        {

            //Esse bool quer dizer se ja foi checado, praquele node, os seus vizinhos, e adicionados ao dicionario
            //As keys do dicionario sao os nodes acessiveis. Claro que nunca havera duplicidade pq se ja existe, nao adicionar denovo...
            Dictionary<Node, bool> nodes_acessiveis = new Dictionary<Node, bool>();

            nodes_acessiveis.Add(nK,false); //Remover no final, coloco so pra funcionar o algoritmo

            bool tem_node_novo = true; //Enquanto tiver node novo ainda nao checado, rodar o while

            while(tem_node_novo)
            {
                tem_node_novo = false; //Pressupoe false....

                foreach (var kvp in nodes_acessiveis.ToList())
                {
                    if (kvp.Value == false)
                    {
                        nodes_acessiveis[kvp.Key] = true; //Cada node novo é checado seus vizinhos conectados...

                        //Todos os conectados ao node atual.
                        foreach (var novo in g.Edges.Where(e => e.nA == kvp.Key || e.nB == kvp.Key).Select(e => (e.nA == kvp.Key) ? e.nB : e.nA))
                        {
                            if (!nodes_acessiveis.Keys.Contains(novo) && (Avoid == null || !Avoid.Contains(novo))) //So é novo se ja nao foi adicionado ao dicionario e não é um node a ser evitado...
                            {
                                nodes_acessiveis.Add(novo, false);
                                tem_node_novo = true; //Se tem node novo, rodar novamente...
                            }
                        }
                    }
                }
            }

            nodes_acessiveis.Remove(nK); //Removendo o nK, afinal a funcao é pra retornar todos acessiveis por ele, nao ele

            return nodes_acessiveis.Keys.ToList();
        }

        //Retorna um PATH, representado por um caminho de Edge.
        //Utilizado em ROUTESEQ
        //Problema do caxeiro viajante.
        Path find_best_route(Graph graph, Node A, Node B, List<Node> Stops)
        {
            throw (new NotImplementedException());
        }

        void set_cost_using_circuity_factor(Edge edge)
        {

        }

        void set_cost_using_distance(Edge edge)
        {

        }

        #endregion

        #region TESTES Solver Foundation
        //TESTANDO SOLVER FOUNDATION - NAO DEU MUITO CERTO...
        /*
    static public Node COG_MFS(List<Node> nodes, int num_cgs, double power_factor)
    {

        Node cog_node = new Node();                  

        SolverContext context = SolverContext.GetContext();
        Model model = context.CreateModel();

        //decisions
        Decision X = new Decision(Domain.Real, "X");
        Decision Y = new Decision(Domain.Real, "Y");

        X.SetInitialValue(0);
        Y.SetInitialValue(0);

        model.AddDecisions(X, Y);

        //Goals
        model.AddGoal("TC", GoalKind.Maximize, Cog_TC(nodes, num_cgs, power_factor, X, Y));

        Solution sol = context.Solve();
        Report report = sol.GetReport();
        Console.WriteLine(report);

        cog_node.x = sol.Decisions.Where(x => x.Name == "X").First().ToDouble();
        cog_node.y = sol.Decisions.Where(x => x.Name == "Y").First().ToDouble();

        return cog_node;
    }

        //Custo total de um cog, conform formula do manual do LOGWARE
    static Term Cog_TC(List<Node> nodes, int num_cgs, double power_factor, Decision X, Decision Y)
        {

            double TC = 0;

            foreach (var node in nodes)
            {
                try
                {
                    TC += (node.cog_rate_gui * node.cog_vol_gui * (Math.Pow((Math.Pow(node.x - X.ToDouble(), 2) + Math.Pow(node.y - Y.ToDouble(), 2)), 2)));
                }
                catch (Exception)
                {

                }
            }

            return TC;
        }

    */

        #endregion
    }
}
