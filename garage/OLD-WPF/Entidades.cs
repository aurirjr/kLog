using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace kLogApp
{
    //UNIDADES SEMPRE NO SI (Kg,m,s)

    public partial class Node
    {
        public double x { get; set; }
        public double y { get; set; }

        public Node() { } //Construtor default para nao dar erro na hora de serializar. Ref: http://stackoverflow.com/questions/19891390/serialize-listt-error-reflecting-field

        public Node(double x, double y)
        {
            this.x = x;
            this.y = y;

            preparar_GUI(); //Preciso disso para a GUI
        }

        //Problema do centro de gravidade
        public double cog_vol = 0; //Volume, em uma unidade qualquer, do ponto de origem/destino
        public double cog_rate = 0; //Taxa, em $und_dinheiro/und_volume/und_distancia

    }

    public partial class Edge
    {
        public Node nA { get; set; } //Node A
        public Node nB { get; set; } //Node B
        public bool directed { get; set; } //Se for arco direcional
        public Node dir_from { get; set; } //Sentido de origem da direção
        public Double cost { get; set; }
        public Double circuity_factor { get; set; } //Definido na GUI em um unico edge ou conjunto de edges (talvez grafo todo)
        public Double max_speed { get; set; } // Estradas podem ter velocidade maxima (m/s)

        public Edge() { } //Construtor default para nao dar erro na hora de serializar. Ref: http://stackoverflow.com/questions/19891390/serialize-listt-error-reflecting-field

        public Edge(Node nA, Node nB, Double cost)
        {
            this.nA = nA;
            this.nB = nB;
            this.cost = cost;

            preparar_GUI();
        }
    }

    public partial class PathE
    {
        public List<Edge> edges;

        public PathE(List<Edge> edges)
        {
            this.edges = edges;
        }
    }

    public partial class Path
    {
        //Define um path como um conjunto de nodes, ordenados em um dicionario ( a ordem de Keys importa ), onde é guardada tambem referencia para cada edge...
        //Nos edges, ja existem referencias para o seus nodes...
        //public Dictionary<Node, Edge> nodes_edges;
        //DICIONARIO NAO GUARDA ORDEM, se quiser guardar, criar alguma list tambem...
        public List<Edge> edges; //Deixei isso mesmo por enquanto
        public List<Node> nodes; //Deixei isso mesmo por enquanto

        public Path(List<Node> nodes, List<Edge> edges) { this.edges = edges; this.nodes = nodes; }
    }

    public class Graph
    {
        public List<Edge> Edges = new List<Edge>();
        public List<Node> Nodes = new List<Node>();
    }

    public partial class Vehicle
    {
        Load load_capacity { get; set; }
        double? max_speed { get; set; }
        List<Load> current_loads { get; set; } //Cargas atualmente presentes no caminhão.
        double? free_capacity_to_allow_pickup { get; set; } //Capacidade livre, em %, para permitir pickups. 0% permite sempre, 100% só permite com caminhão vazio.
        double? fixed_cost { get; set; } // Taxa de custo de utilização do veiculo, em $/s. Ver pagina 21 do manual do logware. Esse custo existe em todo o período da rota.
        double variable_cost { get; set; } // Taxa de custo por metro andado. Ela pode variar em função da carga alocada, do tipo do veiculo, etc...
        double? unload_weight_rate { get; set; } //Taxa de descarregamento em Kg/s - GARGALO DO VEICULO
        double? unload_measure_rate { get; set; } //Taxa de descarregamento em m³/s - GARGALO DO VEICULO
        Driver current_driver; //Motorista alocado ao veiculo
    }

    public partial class Driver
    {
        PeriodoDia daily_availability_period { get; set; } // Tempo do dia, em segundos, que ele está contratado, incorrendo em custos.
        List<PeriodoDia> daily_breaks { get; set; } // Paradas, em segundos, que ocorrem dentro do período contratado.
        PeriodoDia normal_cost_daily_period { get; set; } // Horario do dia com custo normal. Qualquer horario fora é custo extra.
        Double? normal_cost_variable_rate { get; set; } //Custo, em ($/s) dentro do periodo.
        Double? extra_cost_variable_rate { get; set; } //Custo, em ($/s) fora do timespan.
    }

    public partial class Stop
    {
        StoppableNode node_to_stop { get; set; }
        List<Load> loads_to_delivery { get; set; }
        List<Load> loads_to_pickup { get; set; }
    }

    public partial class StoppableNode : Node
    {
        double? unload_weight_rate { get; set; } //Taxa de descarregamento em Kg/s - GARGALO DO LOCAL
        double? unload_measure_rate { get; set; } //Taxa de descarregamento em m³/s - GARGALO DO LOCAL
        PeriodoDia daily_working_period { get; set; } //Tempo de funcionamento.

        public StoppableNode(double x, double y) : base(x, y)
        {

        }

    }

    public partial class PeriodoDia //Representa um intervalo durante o dia.
    {

        public PeriodoDia() { } // Para evitar: cannot be serialized because it does not have a parameterless constructor...

        //TODO: Esse intervalo será facilmente definido na GUI em forma de barras reguláveis

        private int _start; //Valor inicial de segundos do dia. Minimo de 0.
        private int _end; //Valor final de segundos do dia. Maximo: 86400.

        public int start
        {
            get { return _start; }
            set { _start = Math.Min(Math.Max(0, value), 86400); } //Garante que não sairá do intervalo de 24horas
        }

        public int end
        {
            get { return _end; }
            set { _end = Math.Min(Math.Max(0, value), 86400); } //Garante que não sairá do intervalo de 24horas
        }

        public PeriodoDia(int start, int end) //Sempre em segundos.
        {
            this.start = start;
            this.end = end;
        }
    }

    public partial class Load
    {
        Double measure { get; set; } // m³
        Double weight { get; set; } // Kg
    }

    public partial class Region
    {
        //No Router do Logware, pode representar barreiras geográficas ou regiões de velocidade.
        //Barreiras geográficas não são tratadas nos calculos. Somente servem para objetivos visuais. O usuário irá traçar rotas, adicionando quantos nodes desejar, para desviar visualmente das barreiras.
        //Graficamente, uma barreira pode ser definida como barreira, impedindo que um node seja colocado em seu interior.
        //Uma região pode também representar uma limitante de velocidade, pois cidades, campos, etc, possuem velocidades diferentes.

        //Por simplificação, imaginei somente dois tipos de regiões:

        //NAS INTERÇÔES ENTRE UM EDGE E UMA REGIÃO, DEVERÁ SER CRIADO UM NÓ.

        //Valores indicativos
        public static readonly int SHAPE_CIRCLE = 0;
        public static readonly int SHAPE_RECT = 1;
        public static readonly int TYPE_BARRIER = 0;
        public static readonly int TYPE_SPEED_ZONE = 1;

        public int shape;
        public int type;

        public Region() { } // Para evitar: cannot be serialized because it does not have a parameterless constructor...

        public Region(int shape, int type)
        {
            this.shape = shape;
            this.type = type;
        }

        //Se for círculo:
        public Node center;
        public Double radius;

        //Se for retangulo:
        public Node left_top_corner; //Ponto superior esquerdo.
        public Node right_bottom_corner; // Ponto inferior direito.

        public Double max_speed { get; set; } // //Uma região pode ter um limite de velocidade maxima (m/s)

    }

    public partial class Geral
    {

        #region PARAMETROS ROUTER
        //Parametros gerais do problema de roteamento de veículos. Do LOGWARE:
        public Double percent_vehicles_in_use_before_allowing_pickups { get; set; }
        public double? max_time_allowed_on_a_route { get; set; } // Em segundos
        public double? max_distance_allowed_on_a_route { get; set; } // Em segundos
        public double? time_will_overtime_begin { get; set; } // Se uma rota demorar mais que esse tempo, taxas extras serão aplicadas.

        #region Valores default:

        #region Do logware:

        public double? default_free_capacity_to_allow_pickup { get; set; } // Se o veículo tiver um valor proprio, vale o mais especifico.
        public double? default_vehicle_speed { get; set; } // Em (m/s). Se o veículo tiver uma velocidade própria, vale o mais especifico.

        #endregion

        #region Outros defaults criados que podem ser sobrescritos pelas entidades especificas.

        public PeriodoDia default_driver_daily_availability_period { get; set; }
        public List<PeriodoDia> default_driver_daily_stops_periods { get; set; }
        public PeriodoDia default_driver_normal_cost_daily_period { get; set; }
        /* Em GUI, esses periodos serão setados em 3 barras de tempo de um dia.
           Uma barra setará UM intervalo para o tempo do dia contratado.
           Outra barra setará quantos intervalos desejar.Paradas para almoço, sono...
           Outra barra setará o intervalo onde o custo é normal. Fora disso é extra.
        >> Criar barras triviais para serem usadas, com café da manhã, almoço e sono. 
        >> DUVIDA: O intervalo de parada é remunarado ou remunerado somente dentro do periodo de aviability? */
        public double? default_driver_normal_cost_rate { get; set; }
        public double? default_driver_extra_cost_rate { get; set; }

        #endregion

        #endregion

        #endregion

        #region PARAMETROS COG/MULTICOG

        public double cog_power_factor { get; set; } = 0.5; //0.5 é default
        public int cog_num_cgs { get; set; } = 1; //1 é default, mas pode ser varios...
        public double cog_solver_precisao { get; set; } = 0.000001; //0,0001% é o default

        #endregion

        public Graph grafo = new Graph();
        public List<Vehicle> veiculos = new List<Vehicle>();
        public List<Driver> motoristas = new List<Driver>();
        public List<Load> cargas = new List<Load>();
        public List<Region> regioes = new List<Region>();
    }
}

