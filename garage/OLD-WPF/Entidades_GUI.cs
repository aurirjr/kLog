using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Xml.Serialization;

namespace kLogApp
{
    //Complementando as classes de Router, temos aqui um foco maior no que é exclusivo da GUI, pouco usado na engine.

    //QUALQUER PROPRIEDADE QUE NAO FOR SER SALVA DEVE RECEBER [XmlIgnore][IgnoreDataMember]

    public partial class Node : INotifyPropertyChanged //O node é um contexto em alguns controls...
    {

        public event PropertyChangedEventHandler PropertyChanged;
        public void RaisePropertyChanged(String caller)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(caller));
            }
        }

        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar isso
        public static BitmapImage icon_node_comum_default;
        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar isso
        public static BitmapImage icon_node_comum_selecionado;
        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar controls
        public Image control; //O control do Node é um Icone

        #region LABEL
        public String _label = null;
        [XmlIgnore][IgnoreDataMember] //Nao precisa salvar o de baixo, o de cima ja e salvo...
        public string Label
        {
            get { return _label; }
            set
            {
                _label = value;
                control_aurea.current_label.Content = value;
            }
        } //É propriedade pois é acessado direto na GUI

        //Existem 8 posicoes para o label de um node...
        // 1 - Norte - 2 - Noroeste 3 - Oest 4 - Suldoeste 5 - Sul 6 - Sudeste 7 - Leste - 8 - Nordeste
        public int _label_pos = 5; //Default é 5, sul
        [XmlIgnore][IgnoreDataMember] //Nao precisa salvar o de baixo, o de cima ja e salvo...
        public int Label_Pos { get { return _label_pos; } set { _label_pos = value; control_aurea.update_label_pos(); } } // Ao alterar, redesenhar mapa

        public string texto_para_output()
        {
            return ((_label != null) ? "[ " + _label.Trim() + " ] " : "") + "( " + String.Format("{0:0.0000}", x) + " ; " + String.Format("{0:0.0000}", y) + " )";
        }

        #region OLD - Antes de label passar diretamente para UserControl
        /*
        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar controls
        public TextBlock control_label; //Nome do node
        //Guardo aqui algumas transformations prontas para serem utilizadas
        [XmlIgnore]
        [IgnoreDataMember] //Nao é pra salvar controls
        static public RotateTransform Rot45 = new RotateTransform() { Angle = 45 }; //Usado para transformar o label, depende tambem do ponto de origem (RenderTransformOrigin)
        [XmlIgnore]
        [IgnoreDataMember] //Nao é pra salvar controls
        static public RotateTransform Rot_45 = new RotateTransform() { Angle = -45 }; //Usado para transformar o label, depende tambem do ponto de origem (RenderTransformOrigin)
        [XmlIgnore]
        [IgnoreDataMember] //Nao é pra salvar controls
        static public Point OrigemEsquerda = new Point(0, 0.5); //Retirei esses valores de properties...
        [XmlIgnore]
        [IgnoreDataMember] //Nao é pra salvar controls
        static public Point OrigemDireita = new Point(1, 0.5); //Retirei esses valores de properties... 
        */
        #endregion
        #endregion

        #region Aurea

        [XmlIgnore]
        [IgnoreDataMember] //Nao é pra salvar controls
        public NodeControl control_aurea; //O control canvas da area é que vai ter diferentes desenhos em funcao da variedade de cores...

        [XmlIgnore]
        [IgnoreDataMember] //Nao precisa salvar o state de selecionado ou nao
        public bool _selecionado_azul = false;
        [XmlIgnore]
        [IgnoreDataMember] //Nao precisa salvar o state de selecionado ou nao
        public bool selecionado_azul
        {
            get
            {
                return _selecionado_azul;
            }
            set
            {
                _selecionado_azul = value;
                redraw_control();
            }
        }

        [XmlIgnore]
        [IgnoreDataMember] //Nao precisa salvar o state de selecionado ou nao
        public bool _selecionado_laranja = false;
        [XmlIgnore]
        [IgnoreDataMember] //Nao precisa salvar o state de selecionado ou nao
        public bool selecionado_laranja
        {
            get
            {
                return _selecionado_laranja;
            }
            set
            {
                _selecionado_laranja = value;
                redraw_control();
            }
        } 
        #endregion

        //X e Y em forma de Distancia - Sempre que for alteado X e Y em forma de distancia ( parametros ), usar o objeto de distancia
        //A default é m, mas se o usuario passar a usar outra, entao salvar com a unidade nova...
        public string unidade_usada_x = "m";

        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar.
        static public Distancia distancia_temporaria = new Distancia("0m",-999999999); //Usada somente como objeto pra converter os X e Y pra GUI - Aceita negativo!
        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar.
        public String texto_X
        {
            get { return x / Distancia.Unidades[unidade_usada_x] + " " + unidade_usada_x; }
            set
            {
                distancia_temporaria.und = "m";
                distancia_temporaria.valor = x;
                distancia_temporaria.distancia_texto = value;
                //Se foi sucesso na alteração, massa, se não, vai voltar para x o mesmo valor...
                unidade_usada_x = distancia_temporaria.und; // Salvar a unidade usada pra esse node...
                x = Distancia.Unidades[unidade_usada_x]*distancia_temporaria.valor; //o x é em metro...

                App.MW.redraw_MapaWin();
            }
        }

        public string unidade_usada_y = "m";

        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar.
        public String texto_Y
        {
            get { return y / Distancia.Unidades[unidade_usada_y] + " " + unidade_usada_y; }
            set
            {
                distancia_temporaria.und = "m";
                distancia_temporaria.valor = y;
                distancia_temporaria.distancia_texto = value;
                //Se foi sucesso na alteração, massa, se não, vai voltar para y o mesmo valor...
                unidade_usada_y = distancia_temporaria.und; // Salvar a unidade usada pra esse node...
                y = Distancia.Unidades[unidade_usada_y] * distancia_temporaria.valor; //o y é em metro...

                App.MW.redraw_MapaWin();
            }
        }

        //Problema do centro de gravidade - GUI
        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar.
        public double cog_vol_gui //Volume, em uma unidade qualquer, do ponto de origem/destino
        {
            get { return cog_vol; }
            set { cog_vol = value; RaisePropertyChanged("cog_vol_gui"); }
        }
        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar.
        public double cog_rate_gui //Taxa, em $und_dinheiro/und_volume/und_distancia
        {
            get { return cog_rate; }
            set { cog_rate = value;  RaisePropertyChanged("cog_rate_gui"); }
        }
   
        public void preparar_GUI()
        {
            icon_node_comum_default = new BitmapImage(new Uri("imgs/geolocation.png", UriKind.Relative));
            icon_node_comum_selecionado = new BitmapImage(new Uri("imgs/geolocation_azul.png", UriKind.Relative));

            //O node é adicionado ao tag, muito util para respota de eventos como mouse_enter e mouse_leave...
            control = new Image() { Source = Node.icon_node_comum_default, Tag = this };
            Panel.SetZIndex(control, 100); //Em cima dos edges - Dessa forma ferramentas como MoveNode pegam facil um node e nao os edges...

            control_aurea = new NodeControl();
            control_aurea.set_node(this);
            Panel.SetZIndex(control_aurea, -999); //Send to back - As aureas sempre vao atraz...
            redraw_control();            

            //Se um evento deve acontecer na area da AUREA e do NODE/EDGE, entao quando entrar ou sair do node, repassar o mesmo evento da aurea...
            //Se nao for assim, ao entrar/sair no NODE/EDGE ele sai/entra na AUREA e nao mantem o comportamento...

            //Se deve acontecer na area do node, entao nao se preocupar com o evento da aurea...

            control.MouseEnter += Control_MouseEnter;
            control.MouseLeave += Control_MouseLeave;
            control.MouseLeftButtonUp += Control_MouseLeftButtonUp;
            control.MouseLeftButtonDown += Control_MouseLeftButtonDown;

            control_aurea.Aurea_cor_Middle.MouseEnter += Control_Aurea_MouseEnter;
            control_aurea.Aurea_cor_Middle.MouseLeave += Control_Aurea_MouseLeave;
            //control_aurea.MouseLeftButtonUp += Control_Aurea_MouseLeftButtonUp; //Ainda nao precisei
            control_aurea.Aurea_cor_Middle.MouseLeftButtonDown += Control_Aurea_MouseLeftButtonDown;
        }

        //Redesenha a aurea em funcao do estado do node... pode ter diferentes cores, etc...
        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar controls
        public List<SolidColorBrush> cores_aurea_temp = new List<SolidColorBrush>(); //Temporario para guardar as cores da aurea
        private void redraw_control()
        {
            cores_aurea_temp.Clear();

            //A cor da aurea depende do status do node...
            //Considerar selecionado azul, selecionado laranja, e mouse em cima...

            //A prioridade sempre é laranja/azul/verde
            if (selecionado_laranja) cores_aurea_temp.Add(Brushes.LightSalmon); //Depois laranja...
            if (selecionado_azul) cores_aurea_temp.Add(Brushes.LightBlue); //Depois azul...
            if (App.MW.mouse_over == this) cores_aurea_temp.Add(Brushes.LightGreen);          

            control_aurea.set_aurea_cor(cores_aurea_temp);
        }

        //Clique com botao esquerdo no node ocasiona diferentes ações dependendo da tool
        private void Control_MouseLeftButtonUp(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (App.MW.SelectedTool == App.MW.BT_Tool_AddEdge)
            {
                //Começar a traçar um novo node. Entao esse node sera o primeiro.
                if (App.MW.Tool_AddEdge_First_Node == null)
                {
                    App.MW.Tool_AddEdge_First_Node = this;
                }
                else
                {
                    //Se ja tem um node, que é o primeiro, e acontece um novo clique, em um diferente do primeiro, entao é o segundo e ultimo...
                    //Adicionar um edge e dar redraw no mapa...
                    //Adicionar somente se este edge ja nao existe...

                    //Tanto faz de A pra B ou de B pra A... Por enquanto nao considero sentidos...
                    bool edge_ja_existe = false;
                    foreach (Edge edge in App.MW.geral.grafo.Edges)
                    {
                        if ((edge.nA == App.MW.Tool_AddEdge_First_Node && edge.nB == this)
                            || (edge.nB == App.MW.Tool_AddEdge_First_Node && edge.nA == this))
                        {
                            edge_ja_existe = true;
                            break;
                        }
                    }

                    if(!edge_ja_existe)
                    {
                        App.MW.geral.grafo.Edges.Add(new Edge(App.MW.Tool_AddEdge_First_Node, this, 0));
                        App.MW.redraw_MapaWin(); //Redesenhar o mapa
                        App.MW.Tool_AddEdge_First_Node = this; //Agora esse passa a ser o novo node... se quizer desistir da ferramenta, use botao esquerdo...
                    }
                }
            }
            else if (App.MW.SelectedTool == null)
            {
                //Se nao tem nenhuma linha selecionada, e esse o objeto verde ( com mouse em cima ), selecioná-lo.
                if(App.MW.mouse_over == this)
                {
                    //Removendo a selecao de todo mundo e colocando so nesse...
                    App.MW.geral.grafo.Nodes.ForEach(x => x.selecionado_azul = false);
                    selecionado_azul = true;
                    App.MW.RaisePropertyChanged("selected_node_azul_count");
                }
            }
        }

        //Segurar com o botao esquerda, que ocasiona diferentes ações dependendo da rool
        private void Control_MouseLeftButtonDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (App.MW.SelectedTool == App.MW.BT_Tool_MoveNode)
            {
                //Nesse caso, importa a area da aurea, rebater o evento pra la
                Control_Aurea_MouseLeftButtonDown(sender, e);
            }
        }

        //Segurar com o botao esquerda, que ocasiona diferentes ações dependendo da rool
        private void Control_Aurea_MouseLeftButtonDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if (App.MW.SelectedTool == App.MW.BT_Tool_MoveNode)
            {
                App.MW.Tool_MoveNode_MovingNode = this;
            }
        }

        //O melhor comportamento de mouse over ja é obtido assim. Basta deixar o mouse em cima do ultimo control onde teve mouseover.
        //Testei e é o melhor comportamento intuitivo, nao tendo problemas quando houver varios nodes proximos. O ultimo com over é o correto.
        //EDIT: Prefiro destacar o node ao se passar o mouse em cima dele do que da aurea, da mais precisao, ao contrario do edge, que por ser fino coloco o evento na aurea...
        private void Control_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            //Nesse caso, nao quero fazer a nivel de aurea, e sim a nivel de node, entao nao rebato nada...
            if(App.MW.SelectedTool == null || App.MW.SelectedTool == App.MW.BT_Tool_AddEdge
                || App.MW.SelectedTool == App.MW.BT_MultiSelectAzul || App.MW.SelectedTool == App.MW.BT_MultiSelectLaranja)
            {
                App.MW.mouse_over = this; //Esse é o node corrente.

                //Aposentado ao se criar aureas:
                //Canvas.SetLeft(App.MW.MouseOver_Nodes, App.MW.get_X_Win_Pos_From_Mapa_Pos(this.x) - 4);
                //Canvas.SetTop(App.MW.MouseOver_Nodes, App.MW.get_Y_Win_Pos_From_Mapa_Pos(this.y) - 4);

                redraw_control();
            }
            else if (App.MW.SelectedTool == App.MW.BT_Tool_MoveNode)
            {
                //Para a maosinha ficar mais precisa, pegar a nivel de aurea:
                Control_Aurea_MouseEnter(sender, e);
            }
            
        }

        private void Control_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            if (App.MW.SelectedTool == null || App.MW.SelectedTool == App.MW.BT_Tool_AddEdge 
                || App.MW.SelectedTool == App.MW.BT_MultiSelectAzul || App.MW.SelectedTool == App.MW.BT_MultiSelectLaranja)
            {
                App.MW.mouse_over = null; //Removendo este como o node corrente.

                //Aposentado ao se criar aureas:
                //Canvas.SetLeft(App.MW.MouseOver_Nodes, -40);
                //Canvas.SetTop(App.MW.MouseOver_Nodes, -40);

                redraw_control();
            }
            else if (App.MW.SelectedTool == App.MW.BT_Tool_MoveNode)
            {
                //Para a maosinha ficar mais precisa, pegar a nivel de aurea:
                Control_Aurea_MouseLeave(sender, e);
            }
        }

        private void Control_Aurea_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            if (App.MW.SelectedTool == App.MW.BT_Tool_MoveNode)
            {
                App.MW.mouse_over = this; //Esse é o node corrente.
                redraw_control();
            }
        }

        private void Control_Aurea_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            if (App.MW.SelectedTool == App.MW.BT_Tool_MoveNode)
            {
                App.MW.mouse_over = null; //Removendo este como o node corrente.

                redraw_control(); //So descolorir se nao for o node selecionado...

            }
        }

        public static bool Remover_Node(Node node, bool SemAlerta) //Retorna true se removeu o node, false se nao removeu
        {
            //Check A - Confirmação
            if (!SemAlerta && MessageBoxResult.Yes != MessageBox.Show("Deseja mesmo remover o Vértice selecionado?", "Atenção!", System.Windows.MessageBoxButton.YesNoCancel, MessageBoxImage.Warning)) { return false; }

            //Check B - Checando se tem edges ligados a este node.
            var ligados_ao_node = App.MW.geral.grafo.Edges.Where(x => x.nA == node || x.nB == node).ToList();

            if (ligados_ao_node != null && ligados_ao_node.Count() > 0)
            {
                if (!SemAlerta && MessageBoxResult.Yes != MessageBox.Show("Existem arestas ligadas a este vértice. Se continuar, elas serão removidas. Continuar?", "Atenção!", System.Windows.MessageBoxButton.YesNoCancel, MessageBoxImage.Warning)) { return false; } //Se nao a janela sai quando o mesage box aparecer...

                //Removendo arestas
                foreach (var edge in ligados_ao_node)
                {
                    App.MW.geral.grafo.Edges.Remove(edge);
                    App.MW.MapaWin.Children.Remove(edge.control);
                }
            }

            //Se for um node selecionado, dar update na GUI pq pode mudar algo
            if(node.selecionado_azul || node.selecionado_laranja)
            {
                node.selecionado_azul = false;
                App.MW.RaisePropertyChanged("selected_node_azul_count");
                node.selecionado_laranja = false;
                App.MW.RaisePropertyChanged("selected_node_laranja_count");
            }

            //Removendo node:
            App.MW.geral.grafo.Nodes.Remove(node);
            App.MW.MapaWin.Children.Remove(node.control); //Removendo control do node
            App.MW.MapaWin.Children.Remove(node.control_aurea); //Removendo control da aurea

            //Redraw map:
            App.MW.redraw_MapaWin();

            return true;
        }
    }

    public partial class Edge
    {

        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar controls
        public EdgeControl control; //O control do Edge é uma linha

        [XmlIgnore][IgnoreDataMember] //Nao precisa salvar o state de selecionado ou nao
        public bool _selecionado_azul = false;
        [XmlIgnore][IgnoreDataMember] //Nao precisa salvar o state de selecionado ou nao
        public bool selecionado_azul
        {
            get
            {
                return _selecionado_azul;
            }
            set
            {
                _selecionado_azul = value;
                redraw_control();
            }
        }
        [XmlIgnore][IgnoreDataMember] //Nao precisa salvar o state de selecionado ou nao
        public bool _selecionado_laranja = false;
        [XmlIgnore][IgnoreDataMember] //Nao precisa salvar o state de selecionado ou nao
        public bool selecionado_laranja
        {
            get
            {
                return _selecionado_laranja;
            }
            set
            {
                _selecionado_laranja = value;
                redraw_control();
            }
        }

        //Redesenha a aurea em funcao do estado do node... pode ter diferentes cores, etc...
        [XmlIgnore][IgnoreDataMember] //Nao é pra salvar controls
        public List<SolidColorBrush> cores_temp = new List<SolidColorBrush>(); //Temporario para guardar as cores da aurea

        //Redesenha o control, conforme aprendido com node...
        private void redraw_control()
        {
            cores_temp.Clear();

            //A cor da aurea depende do status do node...
            //Considerar selecionado azul, selecionado laranja, e mouse em cima...

            //A prioridade sempre é laranja/azul/verde
            if (selecionado_laranja) cores_temp.Add(Brushes.LightSalmon); //Depois laranja...
            if (selecionado_azul) cores_temp.Add(Brushes.LightBlue); //Depois azul...
            if (App.MW.mouse_over == this) cores_temp.Add(Brushes.LightGreen);

            control.set_cores(cores_temp);
        }

        public void preparar_GUI()
        {
            control = new EdgeControl();
            control.set_edge(this);

            redraw_control();

            //Se um evento deve acontecer na area da AUREA e do NODE/EDGE, entao quando entrar ou sair do node, repassar o mesmo evento da aurea...
            //Se nao for assim, ao entrar/sair no NODE/EDGE ele sai/entra na AUREA e nao mantem o comportamento...

            control.MouseEnter += Control_MouseEnter; 
            control.MouseLeave += Control_MouseLeave;
            control.MouseLeftButtonUp += Control_MouseLeftButtonUp;
        }

        //Clique com botao esquerdo no edge ocasiona diferentes ações dependendo da tool
        private void Control_MouseLeftButtonUp(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            //if (App.MW.SelectedTool == App.MW.BT_Tool_AddEdge)
            //{

            //}
            //else
            if (App.MW.SelectedTool == null)
            {
                //Se nao tem nenhuma linha selecionada, e esse o objeto verde ( com mouse em cima ), selecioná-lo.
                if (App.MW.mouse_over == this)
                {
                    //Removendo a selecao de todo mundo e colocando so nesse...
                    App.MW.geral.grafo.Edges.ForEach(ee => ee.selecionado_azul = false);
                    selecionado_azul = true;
                    App.MW.RaisePropertyChanged("selected_edge_azul_count");
                }
            }
        }

        private void Control_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            if (App.MW.SelectedTool == null || App.MW.SelectedTool == App.MW.BT_MultiSelectAzul || App.MW.SelectedTool == App.MW.BT_MultiSelectLaranja)
            {
                App.MW.mouse_over = this; //Objeto com o mouse over do momento...

                redraw_control();
            }
        }

        private void Control_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            if (App.MW.SelectedTool == null || App.MW.SelectedTool == App.MW.BT_MultiSelectAzul || App.MW.SelectedTool == App.MW.BT_MultiSelectLaranja)
            {
                App.MW.mouse_over = null;

                redraw_control();               
            }
            //else if ()
            //{

            //}
        }
    }

    public partial class Geral : INotifyPropertyChanged //Geral é um contexto em alguns controls...
    {
        public event PropertyChangedEventHandler PropertyChanged;
        public void RaisePropertyChanged(String caller)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(caller));
            }
        }

        [XmlIgnore][IgnoreDataMember] //Nao precisa salvar
        public double cog_power_factor_gui
        {
            get
            {
                return cog_power_factor;
            }
            set
            {
                cog_power_factor = value;
                RaisePropertyChanged("cog_power_factor_gui");
            }
        }

        [XmlIgnore][IgnoreDataMember] //Nao precisa salvar
        public int cog_num_cgs_gui
        {
            get
            {
                return cog_num_cgs;
            }
            set
            {
                cog_num_cgs = value;
                RaisePropertyChanged("cog_num_cgs_gui");
            }
        }
    }

}


