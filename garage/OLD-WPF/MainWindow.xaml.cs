using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.Xml;
using System.Xml.Serialization;

namespace kLogApp
{
    public partial class MainWindow : Window, INotifyPropertyChanged
    {

        public Geral geral;
        public Geral geral_gui {  get { return geral; } }
        public NodesList Win_NodesList;

        #region  Basico

        public MainWindow()
        {
            App.MW = this; //Referencia util em diversas situações.

            InitializeComponent();

            //Criando um novo problema
            geral = new Geral();
            RaisePropertyChanged("geral_gui");

            #region TESTES E DEBUG

            ///* TESTES E DEBUG

            //Node a = new Node(get_X_Mapa_Pos_From_Win_Pos(100), get_Y_Mapa_Pos_From_Win_Pos(100));
            //Node b = new Node(get_X_Mapa_Pos_From_Win_Pos(40), get_Y_Mapa_Pos_From_Win_Pos(60));

            //geral.grafo.Nodes.Add(a);
            //geral.grafo.Nodes.Add(b);

            //geral.grafo.Edges.Add(new Edge(a, b, 0));

            //redraw_MapaWin();

            ///////////////////////////////////////////////return;
            return;

            var objeto_serial = carregar_arquivo_klog_versao_nova(@"C:\Users\Gauss\OneDrive\kLog\VS\Testes.klog\Problema1.kLog");

            if (objeto_serial.tipo_arquivo == 101)
            {
                preparar_gui_novo_geral();
                geral = objeto_serial.geral;
                RaisePropertyChanged("geral_gui");

                //Reconstruindo todos os controls e o que for necessario da GUI
                foreach (var node in geral.grafo.Nodes) node.preparar_GUI();
                foreach (var edge in geral.grafo.Edges) edge.preparar_GUI();

                //Recarregando vizualização:
                zoom = objeto_serial.zoom;
                RaisePropertyChanged("zoom_txt"); //Atualizar GUI que mostra o zoom
                center_x_m = objeto_serial.center_x_m;
                center_y_m = objeto_serial.center_y_m;

                redraw_MapaWin();
            } // else if...

            //*/ //## END 
            #endregion

        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            //Ref: http://stackoverflow.com/questions/4306593/wpf-how-to-set-a-dialog-position-to-show-at-the-center-of-the-application
            Win_NodesList = new NodesList() { Owner = this }; //Tela de lista de nodes

            //Nao comprovei essa teoria:
            //Panel.SetZIndex(MapaWin, -9999); //Manter o mapawin o mais fundo possivel, do contrario clicks em cima de aureas e outras coisas mais no back podem acontecer no mapawin...
        }

        public event PropertyChangedEventHandler PropertyChanged;
        public void RaisePropertyChanged(String caller)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(caller));
            }
        }

        public void alertar(int tipo, String msg_top, String msg_down)
        {
            //Tipos de alerta:
            //1: MsgBox tipo warning!

            if (tipo == 1)
            {
                MessageBox.Show(msg_down, msg_top, MessageBoxButton.OK, MessageBoxImage.Warning); return;
            }
            else if (tipo ==2 )
            {
                //...
            }
        }

        #endregion

        #region TOOLS

        //Controla a tool selecionada no momento
        private Button _selectedTool;
        public Button SelectedTool
        {
            get
            {
                return _selectedTool;
            }
            set
            {
                //Limpando restos de outras ferramentas
                limpar_os_restos_das_tools();

                //Remover a cor de verde da tool selecionada anteriormente.
                if (_selectedTool != null) _selectedTool.Background = Brushes.White;

                //Colocar cor de verde na tool atual.
                _selectedTool = value;
                if (_selectedTool != null) _selectedTool.Background = Brushes.LightGreen;

                #region Tratamentos especiais de tools especificas
                //No multiselect, mudar a cor da GUI dependendo da tool
                if (SelectedTool == BT_MultiSelectAzul) MultiSelect_GUI.Fill = Brushes.LightBlue;
                if (SelectedTool == BT_MultiSelectLaranja) MultiSelect_GUI.Fill = Brushes.LightSalmon; 
                #endregion

                //Definir o cursor
                RaisePropertyChanged("cur_tool_atual");
            }
        }

        public void limpar_os_restos_das_tools()
        {
            //Limpando restos de outras ferramentas
            //Se ta removendo a seleção das ferramentas ou selecionando outra, então
            //Esconder a linha do pan:

            Line_Red_Doted.X1 = 0;
            Line_Red_Doted.Y1 = 0;
            Line_Red_Doted.X2 = 0;
            Line_Red_Doted.Y2 = 0;

            realizando_pan_sem_ferramenta = false;

            Line_AddEdge.X1 = 0;
            Line_AddEdge.Y1 = 0;
            Line_AddEdge.X2 = 0;
            Line_AddEdge.Y2 = 0;

            Tool_AddEdge_First_Node = null;
            Tool_MoveNode_MovingNode = null;
        }

        //Cursor da tool selecionada no momento.
        public Cursor cur_tool_atual
        {
            get
            {
                if (SelectedTool == null) return null; //Inicia como null
                else if(SelectedTool == BT_Tool_AddNode) return App.A.Cur_AddNode;
                else if (SelectedTool == BT_Tool_AddEdge) return App.A.Cur_AddEdge;
                else if (SelectedTool == BT_Tool_MoveNode) return App.A.Cur_MoveNode; //O HotSpot da maosinha é no meio... editei com o AniFX
                else if (SelectedTool == BT_MultiSelectAzul) return App.A.Cur_MultiSelectAzul;
                else if (SelectedTool == BT_MultiSelectLaranja) return App.A.Cur_MultiSelectLaranja;
                return null; //Nada selecionado, cursor normal...
            }
        }

        public void click_Tool(object sender, RoutedEventArgs e)
        {
            //Acoes pontuais
            if (sender == BT_NodesList) { SelectedTool = null; Win_NodesList.Visibility = Visibility.Visible; Win_NodesList.Activate(); return; } //Abrir a janela de nodes

            //Selecionar a tool clicada
            if (SelectedTool != sender) SelectedTool = sender as Button;
            else SelectedTool = null; //Se a tool clicada ja esta selecionada, entao deselecionar.
        }

        public Node Tool_AddEdge_First_Node = null; //Usado pelo TOOL AddEdge para determinar se tem algum Node marcado como o primeiro...
        public Node Tool_MoveNode_MovingNode = null; //Esse é o node sendo movido correntemente...

        #endregion

        #region Mapa - Zoom, Pan, Redraw...

        public Object mouse_over = null; //Objeto que o mouse esta passando por cima no momento...

        //O MapaWin é uma janela de visualização do mapa real. O seu tamanho é sempre definido pelo Width e Height do Canvas MapaWin.
        //O zoom e scroll são os fatores que relacionam as dimensoes de MapaWin com as dimensoes reais do mapa;

        static readonly double zoom_default = 100; //Em metros; Pode ser um futuro parametro do programa geral!!
        static readonly double tamanho_barra_legenda_dp = 52; //O tamanho na MainWindow é 52. 52dp.
        //Zoom: A relação entre a barra da legenda e o valor do zoom é sempre decisivo! É a relação m/dp

        //TODO: Enquanto o zoom não é salvo com o problema, usar o default
        Distancia zoom = new Distancia(zoom_default.ToString()+" m",0,false,6371000); //Coloquei como zoom maximo o raio da terra

        //Isso define qual ponto do mapa, em metros, deve estar sempre no centro da tela.
        //TODO: Quando salvar, salvar isso tambem... Default é (0;0)
        public double center_x_m = 0;
        public double center_y_m = 0;

        public String zoom_txt //Poderia ter colocado direto distancia_texto, mas crio isso aqui para disparar um refresh quando o zoom mudar...
        {
            get
            {
                return zoom.distancia_texto;
            }
            set
            {
                zoom.distancia_texto = value;
                //Refresh mapa
                redraw_MapaWin();
            }
        }

        //Ao clicar nos botões de zoom, dar um zoom de 15% (in ou out). O zoom sempre cresce para o centro...
        public void click_Zoom(object sender, RoutedEventArgs e)
        {
            if (BT_Zoom_In == sender) zoom_porcento(0.15);
            else if (BT_Zoom_Out == sender) zoom_porcento(-0.15);
        }

        private void zoom_porcento(double porcento) //Para zoom in, colocar 0.3, 0.15... Para zoom out, colocar negativo...
        {
            //Pegar o numeral do zoom atual, diminuir ou aumentar de x%, e arredondar para duas casas decimais...
            //Dar zoom out é aumentar o valor da leganda... Dar zoom in é diminuir...
            zoom.valor = (Math.Ceiling((zoom.valor * (1 - porcento)) * 100)) / 100; //Dando um roundup na segunda casa decimal...
            RaisePropertyChanged("zoom_txt");
            redraw_MapaWin();
        }

        private void Zoom_KeyUp(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                (sender as TextBox).RaiseEvent(new RoutedEventArgs(LostFocusEvent)); //Faz perder o focus... Dai atualiza o zoom
            }
        }

        //A escala pode ser drasticamente alterada para qualquer quantidade de metros, kilometros, etc...

        public double get_X_Win_Pos_From_Mapa_Pos(double x_m)
        {
            //(x_m - center_x_m) // Desloca o centro do plano carteziano
            // * (tamanho_barra_legenda_dp / zoom.get_m())) // Ver quandos dp eu tenho que deslocar na GUI, depende do zoom...
            // + MapaWin.ActualWidth/2 // Tudo a partir do centro da tela, que é o local que deve ficar o centro
            return ((x_m - center_x_m) * (tamanho_barra_legenda_dp / zoom.get_m())) + ( MapaWin.ActualWidth / 2);
        }

        public double get_Y_Win_Pos_From_Mapa_Pos(double y_m)
        {
            //(y_m - center_y_m) // Desloca o centro do plano carteziano
            //(MapaWin.ActualHeight - (y_m - center_y_m))
            // * (tamanho_barra_legenda_dp / zoom.get_m())) // Ver quandos dp eu tenho que deslocar na GUI, depende do zoom...
            // Lembrando que o control tem as cordenadas Y positivas para baixo - Dai precisa substrair
            // MapaWin.ActualHeight/2 - // Tudo a partir do centro da tela, que é o local que deve ficar o centro
            return (MapaWin.ActualHeight / 2) - ((y_m - center_y_m) * (tamanho_barra_legenda_dp / zoom.get_m()));
            
        }

        public double get_X_Mapa_Pos_From_Win_Pos(double x_dp)
        {
            //Basta inverter a função get_X_Win_Pos_From_Mapa_Pos
            return ((x_dp - MapaWin.ActualWidth/2)* zoom.get_m() / tamanho_barra_legenda_dp) + center_x_m;
        }

        public double get_Y_Mapa_Pos_From_Win_Pos(double y_dp)
        {
            //Basta inverter a função get_Y_Win_Pos_From_Mapa_Pos
            return ((MapaWin.ActualHeight / 2 - y_dp) * zoom.get_m() / tamanho_barra_legenda_dp) + center_y_m;
        }

        bool realizando_multi_select = false;
        double? multi_select_X1 = null;
        double? multi_select_Y1 = null;
        bool realizando_pan_sem_ferramenta = false;
        private void MapaWin_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (SelectedTool == null && mouse_over == null) //Somente realizar pan se nao estiver em cima de algo
            {
                //Se nao tem nem uma ferramenta selecionada, então começa um pan...
                realizando_pan_sem_ferramenta = true;
                Line_Red_Doted.X1 = e.GetPosition(MapaWin).X;
                Line_Red_Doted.Y1 = e.GetPosition(MapaWin).Y;
                Line_Red_Doted.X2 = Line_Red_Doted.X1;
                Line_Red_Doted.Y2 = Line_Red_Doted.Y1;
            }
            else if (SelectedTool == BT_MultiSelectAzul || SelectedTool == BT_MultiSelectLaranja)
            {
                realizando_multi_select = true;
                multi_select_X1 = e.GetPosition(MapaWin).X;
                multi_select_Y1 = e.GetPosition(MapaWin).Y;
            }
        }

        private void MapaWin_MouseLeave(object sender, MouseEventArgs e)
        {
            LB_MousePos.Text = "( ... )";

            if (realizando_pan_sem_ferramenta)
            {
                realizando_pan_sem_ferramenta = false;
                Line_Red_Doted.X1 = 0;
                Line_Red_Doted.Y1 = 0;
                Line_Red_Doted.X2 = 0;
                Line_Red_Doted.Y2 = 0;
            }
            else if (realizando_multi_select)
            {
                realizando_multi_select = false;
                Redraw_MultiSelect_GUI(0, 0, 0, 0);
                multi_select_X1 = null;
                multi_select_Y1 = null;
            }
        }

        private void MapaWin_MouseUp_Left(object sender, MouseButtonEventArgs e)
        {
            //Adicionar node
            if (SelectedTool == BT_Tool_AddNode)
            {
                //Adicionando Node ao problema
                //Correção de 8x8 por causa do cursor e do icone... centralizando
                //Dou roundup para UMA casa decimal, para nao ficar numeros bizarros na conversao...
                //Se desejar colocar valores em metro nao inteiros, basta usar a lista ou edicao direta de um node...
                var node = new Node(Math.Ceiling(get_X_Mapa_Pos_From_Win_Pos(e.GetPosition(MapaWin).X - 8)*10)/10, Math.Ceiling(get_Y_Mapa_Pos_From_Win_Pos(e.GetPosition(MapaWin).Y - 8)*10)/10);
                geral.grafo.Nodes.Add(node);

                //Redesenhando mapa
                redraw_MapaWin();

                //Essa ferramente é deselecionada apos o uso
                //SelectedTool = null; //Deixa.....
            }
            else if (SelectedTool == BT_Tool_MoveNode) //Ao soltar o move node, mudar a posição do node e dar redraw
            {
                if (Tool_MoveNode_MovingNode != null)
                {
                    //Dou roundup para UMA casas decimais, para nao ficar numeros bizarros na conversao...
                    //Se desejar colocar valores em metro nao inteiros, basta usar a lista ou edicao direta de um node...

                    Tool_MoveNode_MovingNode.x = Math.Ceiling(get_X_Mapa_Pos_From_Win_Pos(e.GetPosition(MapaWin).X - 8) * 10) / 10;
                    Tool_MoveNode_MovingNode.y = Math.Ceiling(get_Y_Mapa_Pos_From_Win_Pos(e.GetPosition(MapaWin).Y - 8) * 10) / 10;

                    Tool_MoveNode_MovingNode.RaisePropertyChanged("texto_X"); //Disparando o event no context certo... Se ele for o node selecionado, dar update em tudo
                    Tool_MoveNode_MovingNode.RaisePropertyChanged("texto_Y"); //Disparando o event no context certo... Se ele for o node selecionado, dar update em tudo

                    Tool_MoveNode_MovingNode = null;

                    Line_Red_Doted.X1 = 0;
                    Line_Red_Doted.Y1 = 0;
                    Line_Red_Doted.X2 = 0;
                    Line_Red_Doted.Y2 = 0;

                    redraw_MapaWin();
                }
            }
            else if (realizando_pan_sem_ferramenta)
            {
                realizando_pan_sem_ferramenta = false;

                //Vai andar justamente o tanto que foi puchado no pan...
                center_x_m -= get_X_Mapa_Pos_From_Win_Pos(Line_Red_Doted.X2) - get_X_Mapa_Pos_From_Win_Pos(Line_Red_Doted.X1); //O centro tem que andar o que a reta andou...
                center_y_m -= get_Y_Mapa_Pos_From_Win_Pos(Line_Red_Doted.Y2) - get_Y_Mapa_Pos_From_Win_Pos(Line_Red_Doted.Y1);

                Line_Red_Doted.X1 = 0;
                Line_Red_Doted.Y1 = 0;
                Line_Red_Doted.X2 = 0;
                Line_Red_Doted.Y2 = 0;

                redraw_MapaWin();
            }
            else if(realizando_multi_select)
            {
                //Adicionando à selecao todo e qualquer node que estava no quadrado
                //Basta checar se, ao mesmo tempo, X1 <= X <= X2 e Y1 <= Y <= Y2

                var X1 = multi_select_X1.Value;
                var Y1 = multi_select_Y1.Value;

                var X2 = e.GetPosition(MapaWin).X;
                var Y2 = e.GetPosition(MapaWin).Y;

                //Se X1 = X2, então foi um clique e não um arrastado, portanto adicionar o node ou edge que esta com mouse_over.
                //So se o o tipo com mouse over for um node...
                if(X1 == X2 && Y1 == Y2)
                {
                    if(mouse_over!=null && mouse_over.GetType() == typeof(Node))
                    {
                        if (SelectedTool == BT_MultiSelectAzul) ((Node)mouse_over).selecionado_azul = !((Node)mouse_over).selecionado_azul;
                        else if (SelectedTool == BT_MultiSelectLaranja) ((Node)mouse_over).selecionado_laranja = !((Node)mouse_over).selecionado_laranja;
                    }
                    else if (mouse_over != null && mouse_over.GetType() == typeof(Edge))
                    {
                        if (SelectedTool == BT_MultiSelectAzul) ((Edge)mouse_over).selecionado_azul = !((Edge)mouse_over).selecionado_azul;
                        else if (SelectedTool == BT_MultiSelectLaranja) ((Edge)mouse_over).selecionado_laranja = !((Edge)mouse_over).selecionado_laranja;
                    }
                }
                else
                {
                    var nodes_atingidos_pela_selecao = new List<Node>();

                    foreach (var node in geral.grafo.Nodes)
                    {
                        var X = get_X_Win_Pos_From_Mapa_Pos(node.x);
                        var Y = get_Y_Win_Pos_From_Mapa_Pos(node.y);

                        if (X >= Math.Min(X1, X2) && X <= Math.Max(X1, X2) && Y >= Math.Min(Y1, Y2) && Y <= Math.Max(Y1, Y2))
                        {
                            nodes_atingidos_pela_selecao.Add(node);

                            if (SelectedTool == BT_MultiSelectAzul) node.selecionado_azul = !node.selecionado_azul;
                            else if (SelectedTool == BT_MultiSelectLaranja) node.selecionado_laranja = !node.selecionado_laranja;
                        }
                    }

                    //Agora analisar se os nodes atingidos pela selecao formam pares nA e nB de edges...
                    foreach(var edge in geral.grafo.Edges)
                    {
                        if (nodes_atingidos_pela_selecao.Contains(edge.nA) && nodes_atingidos_pela_selecao.Contains(edge.nB))
                        {
                            if (SelectedTool == BT_MultiSelectAzul) edge.selecionado_azul = !edge.selecionado_azul;
                            else if (SelectedTool == BT_MultiSelectLaranja) edge.selecionado_laranja = !edge.selecionado_laranja;
                        }
                    }
                }

                //Update GUI:
                RaisePropertyChanged("selected_node_azul_count");
                RaisePropertyChanged("selected_node_laranja_count");
                RaisePropertyChanged("selected_edge_azul_count");
                RaisePropertyChanged("selected_edge_laranja_count");

                //Removendo o multi select
                realizando_multi_select = false;
                Redraw_MultiSelect_GUI(0, 0, 0, 0);
                multi_select_X1 = null;
                multi_select_Y1 = null;
            }
        }

        //TODO: Colocar no manual que botão direito sempre remove a tool atual...
        //TODO: E se nao tiver nenhuma tool, remove a seleção...
        //TODO: E deixe esses comentarios aki...
        private void MapaWin_MouseUp_Right(object sender, MouseButtonEventArgs e)
        {
            if(SelectedTool != null) SelectedTool = null;
            else
            {
                //Se nao tem nenhuma tool selecionada, entao remover a selecao de todos os elementos
                geral.grafo.Nodes.ForEach(x => x.selecionado_azul = false);
                RaisePropertyChanged("selected_node_azul_count");

                geral.grafo.Edges.ForEach(x => x.selecionado_azul = false);
                RaisePropertyChanged("selected_edge_azul_count");
            }
        }

        //Mouse movido dentro do mapa...
        private void MapaWin_Mouse_Move(object sender, MouseEventArgs e)
        {
            //Sempre recalcular a posicao x...
            LB_MousePos.Text = "( " + String.Format("{0:0.0000}",get_X_Mapa_Pos_From_Win_Pos(e.GetPosition(MapaWin).X)) + "m ; " + String.Format("{0:0.0000}", get_Y_Mapa_Pos_From_Win_Pos(e.GetPosition(MapaWin).Y)) + "m )";

            //Dependendo da tool clicada, os movimentos do mouse servem de algo...
            if (SelectedTool == BT_Tool_MoveNode)
            {
                //Se tem algum node sendo movido:
                if (Tool_MoveNode_MovingNode != null)
                {
                    //Sempre do node
                    Line_Red_Doted.X1 = get_X_Win_Pos_From_Mapa_Pos(Tool_MoveNode_MovingNode.x) + 8;
                    Line_Red_Doted.Y1 = get_Y_Win_Pos_From_Mapa_Pos(Tool_MoveNode_MovingNode.y) + 8;

                    //Ao cursor
                    Line_Red_Doted.X2 = e.GetPosition(MapaWin).X; //Esse ajuste centraliza dentro da mão do cursor do pan
                    Line_Red_Doted.Y2 = e.GetPosition(MapaWin).Y;
                }           
                
            }
            else if (realizando_pan_sem_ferramenta)
            {
                Line_Red_Doted.X2 = e.GetPosition(MapaWin).X;
                Line_Red_Doted.Y2 = e.GetPosition(MapaWin).Y;
            }
            else if(realizando_multi_select)
            {
                Redraw_MultiSelect_GUI(multi_select_X1.Value, multi_select_Y1.Value, e.GetPosition(MapaWin).X, e.GetPosition(MapaWin).Y);
            }
            else if (SelectedTool == BT_Tool_AddEdge)
            {
                //Neste caso, se um primeiro Node ja tiver sido selecionado, começar a traçar uma linha dele ao mouse...
                if(Tool_AddEdge_First_Node != null)
                {
                    Line_AddEdge.X1 = get_X_Win_Pos_From_Mapa_Pos(Tool_AddEdge_First_Node.x) + 8; //Essa correção é pra cair em cima do node...
                    Line_AddEdge.Y1 = get_Y_Win_Pos_From_Mapa_Pos(Tool_AddEdge_First_Node.y) + 8; //Essa correção é pra cair em cima do node...

                    //No mouse...
                    Line_AddEdge.X2 = e.GetPosition(MapaWin).X;
                    Line_AddEdge.Y2 = e.GetPosition(MapaWin).Y;
                }                
            }
        }

        private void MapaWin_MouseWheel(object sender, MouseWheelEventArgs e)
        {
            //Os giros aumentam e diminuem em 4%...
            //Zoom in:
            if (e.Delta > 0) zoom_porcento(0.04);
            //Zoom out:
            else if (e.Delta < 0) zoom_porcento(-0.04);

        }

        private void MapaWin_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            redraw_MapaWin(); //Mudando de tamanho, mudar o mapa...
        }

        public void redraw_MapaWin()
        {
            //O mapa só é redesenhado se realmente necessário.

            //O MapaWin sofre alterações quando:
            //  -- Elementos são adicionados ou removidos
            //  -- O zoom é alterado
            //  -- O mapa é movido
            //  -- OLD : O tamanho do MapaWin é alterado ( tela muda de tamanho ).

            //Nao existe nenhum zoom, de nenhum control a nivel de WPF. Tudo que acontece é reposicionar os elementos na tela
            //Os elementos possuem posições reais, no SI (metros). E uma representação na tela. Dar zoom e pan altera essa representação.
            //Somente imprimo na tela aquilo que é relevante, que realmente será mostrado...

            //### PAN ###
            //Em relação ao PAN, seguindo o que aprendi em jogos tile-based, é possível ter areas de escape, a direita e a esquerda...
            //Com essas areas de escape, poderia-se criar uma ferramenta de pan com redraw continuo a cada move do mouse somente do que ta na tela...
            //Mas para facilitar, criei um ferramenta de pan que leva de qualquer ponto ao centro... Ela é pratica e permite um pan a vontade...

            //Vamos averiguar se algum elemento deve aparecer no Mapa e não está aparecendo

            // Tomei a decisão de desenhar tudo no WPF, independete de estar dentro ou nao da tela...
            // Acho que fica com performance melhor do que ficar decidindo se deve ou nao ser impresso...

            //!!!!!!!!!!!!!! SE FICAR LENTO, IMPLEMENTAR ALGO PARA DESENHAR SOMENTE O QUE ESTA NA TELA !!!!!!!!!!!

            //DESENHANDO EDGES - Primeiro para ficar atras...
            foreach (var edge in geral.grafo.Edges)
            {
                //Se o edge ja estiver na tela, somente alterar a posição. Se nao estiver, adicionar.
                if (!MapaWin.Children.Contains(edge.control)) MapaWin.Children.Add(edge.control);

                //Reposicionar
                double X1 = get_X_Win_Pos_From_Mapa_Pos(edge.nA.x) + 8; //Correcao de 8 para cetralizar no node..
                double Y1 = get_Y_Win_Pos_From_Mapa_Pos(edge.nA.y) + 8; //Correcao de 8 para cetralizar no node..
                double X2 = get_X_Win_Pos_From_Mapa_Pos(edge.nB.x) + 8; //Correcao de 8 para cetralizar no node..
                double Y2 = get_Y_Win_Pos_From_Mapa_Pos(edge.nB.y) + 8; //Correcao de 8 para cetralizar no node..

                //O 0,0 do edge eu seto no X1,Y1
                Canvas.SetLeft(edge.control, X1);
                Canvas.SetTop(edge.control, Y1);

                //Agora setando o X2 do edge, que é a diferença aqui...
                edge.control.X2 = X2 - X1;
                edge.control.Y2 = Y2 - Y1;

                //Atualizando a GUI do edge:
                edge.control.RaisePropertyChanged("X2");
                edge.control.RaisePropertyChanged("Y2");
            }

            //DESENHANDO NODES
            foreach (var node in geral.grafo.Nodes)
            {
                if (!MapaWin.Children.Contains(node.control)) MapaWin.Children.Add(node.control);
                if (!MapaWin.Children.Contains(node.control_aurea)) MapaWin.Children.Add(node.control_aurea);

                //Redefinindo as posições
                Canvas.SetLeft(node.control, get_X_Win_Pos_From_Mapa_Pos(node.x));
                Canvas.SetTop(node.control, get_Y_Win_Pos_From_Mapa_Pos(node.y));

                //TODO: Colocar todo o node dentro do control...
                //Desenhando Aureas:
                Canvas.SetLeft(node.control_aurea, get_X_Win_Pos_From_Mapa_Pos(node.x) + 8); //Com esse ajuste ficam bem no centro
                Canvas.SetTop(node.control_aurea, get_Y_Win_Pos_From_Mapa_Pos(node.y) + 8);

                #region OLD - Labels. Antes de eu passar diretamente para o UserControl do Node...
                //Desenhando Labels. So se importa se tiver algo...
                /*
                if (node.Label != null && node.Label != "")
                {
                    //Se nao tinha o control, adicionar...
                    if (!MapaWin.Children.Contains(node.control_label)) MapaWin.Children.Add(node.control_label);

                    // 1 - Norte - 2 - Noroeste 3 - Oest 4 - Suldoeste 5 - Sul 6 - Sudeste 7 - Leste - 8 - Nordeste
                    if (node.Label_Pos == 1 || node.Label_Pos == 5) //Norte e sul possuem texto centralizado
                    {
                        node.control_label.RenderTransform = null; //Sem rotacoes..

                        //Horizontal igual do node
                        //node.control_label.HorizontalContentAlignment = HorizontalAlignment.Center; //Nao funciona. Testei com Label e nada...
                        //Centralizei usando metade do width.
                        Canvas.SetLeft(node.control_label, get_X_Win_Pos_From_Mapa_Pos(node.x) - node.control_label.ActualWidth / 2 + 8); //Corrigir 8 da metade do node

                        if (node.Label_Pos == 1) Canvas.SetTop(node.control_label, get_Y_Win_Pos_From_Mapa_Pos(node.y) - 18); //Norte Sobe um ajuste...
                        else if (node.Label_Pos == 5) Canvas.SetTop(node.control_label, get_Y_Win_Pos_From_Mapa_Pos(node.y) + 15); //Sul - Desce um ajuste...
                    }
                    else if (node.Label_Pos == 3 || node.Label_Pos == 7) //Oeste e leste
                    {
                        node.control_label.RenderTransform = null; //Sem rotacoes..

                        Canvas.SetTop(node.control_label, get_Y_Win_Pos_From_Mapa_Pos(node.y) - 1); //Ambos alinhados com o centro do node e pequenos ajuste

                        if (node.Label_Pos == 3) Canvas.SetLeft(node.control_label, get_X_Win_Pos_From_Mapa_Pos(node.x) - node.control_label.ActualWidth - 3); //Com ajustes
                        else if (node.Label_Pos == 7) Canvas.SetLeft(node.control_label, get_X_Win_Pos_From_Mapa_Pos(node.x) + 19); //Com ajustes
                    }
                    else if (node.Label_Pos == 2) //Noroeste
                    {
                        node.control_label.RenderTransformOrigin = Node.OrigemDireita;
                        node.control_label.RenderTransform = Node.Rot45;
                        Canvas.SetLeft(node.control_label, get_X_Win_Pos_From_Mapa_Pos(node.x) - node.control_label.ActualWidth); //Pequenos ajustes
                        Canvas.SetTop(node.control_label, get_Y_Win_Pos_From_Mapa_Pos(node.y) - 9);
                    }
                    else if (node.Label_Pos == 4) //Sudoeste
                    {
                        node.control_label.RenderTransformOrigin = Node.OrigemDireita;
                        node.control_label.RenderTransform = Node.Rot_45;
                        Canvas.SetLeft(node.control_label, get_X_Win_Pos_From_Mapa_Pos(node.x) - node.control_label.ActualWidth - 2); //Pequenos ajustes
                        Canvas.SetTop(node.control_label, get_Y_Win_Pos_From_Mapa_Pos(node.y) + 8);
                    }
                    else if (node.Label_Pos == 6) //Sudeste
                    {
                        node.control_label.RenderTransformOrigin = Node.OrigemEsquerda;
                        node.control_label.RenderTransform = Node.Rot45;
                        Canvas.SetLeft(node.control_label, get_X_Win_Pos_From_Mapa_Pos(node.x) + 17); //Pequenos ajustes
                        Canvas.SetTop(node.control_label, get_Y_Win_Pos_From_Mapa_Pos(node.y) + 7);
                    }
                    else if (node.Label_Pos == 8) //Nordeste
                    {
                        node.control_label.RenderTransformOrigin = Node.OrigemEsquerda;
                        node.control_label.RenderTransform = Node.Rot_45;
                        Canvas.SetLeft(node.control_label, get_X_Win_Pos_From_Mapa_Pos(node.x) + 15); //Pequenos ajustes
                        Canvas.SetTop(node.control_label, get_Y_Win_Pos_From_Mapa_Pos(node.y) - 7);
                    }
                } */ 
                #endregion
            }

            #region Antes da decisao de desenhar tudo...
            /* DECISAO DE DESENHAR TUDO

                //DESENHANDO NODES
                foreach(var node in geral.grafo.Nodes)
                {
                    double mapa_win_x = get_X_Win_Pos_From_Mapa_Pos(node.x);
                    double mapa_win_y = get_Y_Win_Pos_From_Mapa_Pos(node.y);

                    //Nodes um pouco fora do mapa tambem sao desenhados, para nao sumir o node todo so pq uma parte dele saiu de vista...
                    int limites_aceitos = 20;

                    //Precisa estar dentro da janela no MapaWin
                    if (mapa_win_x > (0 - limites_aceitos) && mapa_win_x < (MapaWin.ActualWidth + limites_aceitos) 
                        && mapa_win_y > (0 - limites_aceitos) && mapa_win_y < (MapaWin.ActualHeight + limites_aceitos))
                    {
                        //Elemento deve estar desenhado na tela
                        //Se ja estiver, nada fazer. Se não, adicionar.
                        if(!MapaWin.Children.Contains(node.control))
                        {
                            MapaWin.Children.Add(node.control);
                        }

                        //Redefinindo as posições
                        Canvas.SetLeft(node.control, mapa_win_x);
                        Canvas.SetTop(node.control, mapa_win_y);
                    } else
                    {
                        //Elemento NÃO deve estar desenhado na tela.
                        //Se nao estiver, nada fazer. Se estiver, remover.
                        if (MapaWin.Children.Contains(node.control))
                        {
                            MapaWin.Children.Remove(node.control);
                        }
                    }
                }

                //DESENHANDO EDGES
                foreach (var edge in geral.grafo.Edges)
                {
                    //Para desenhar um node, achei que fosse preciso que pelo menos um de seus edges estejam desenhados no mapa.
                    //Um criterio rapido para decidir desenhar vaios edges... mas nao é geral... Imagine um edge no canto, com os nodes fore da tela...
                    //O edge aparece e os nodes nao... Entao imaginei... basta que a menor distancia, entre o centro e segmento, estejam na reta que é o raio da tela...
                    //Isso garante que o edge esta em um circulo, de raio igual a metade da diagonal de mapawin...

                    //Para tanto, penei um pouco na algebra, no calculo de projecao ortogonal, quando ta dentro e fora do segmento etc...
                    //Mas acabei usando uma fucao pronta...

                    //Claro que nao pega a area exata do quadrado... fica pegando a area do circulo circunscrito ao quadrado. Mas e uma otima escolha...

                    if(MapaWin.Children.Contains(edge.nA.control) || MapaWin.Children.Contains(edge.nB.control) //||
                       || LIB.Menor_Distancia_Ponto_A_Segmento(center_x_m, center_y_m, edge.nA.x, edge.nA.y, edge.nB.x, edge.nB.y) < 
                                //Dependendo da forma como esta a tela, o raio considerado pode ser metade do width ou metade do height... sempre o maior....
                                Math.Max(get_X_Mapa_Pos_From_Win_Pos(MapaWin.ActualWidth/2), get_Y_Mapa_Pos_From_Win_Pos(MapaWin.ActualHeight / 2)
                            )
                        )
                    {
                        //Se o edge ja estiver na tela, somente alterar a posição. Se nao estiver, adicionar.
                        if (!MapaWin.Children.Contains(edge.control)) MapaWin.Children.Add(edge.control);

                        //Reposicionar
                        edge.control.X1 = get_X_Win_Pos_From_Mapa_Pos(edge.nA.x) + 8; //Correcao de 8 para cetralizar no node..
                        edge.control.Y1 = get_Y_Win_Pos_From_Mapa_Pos(edge.nA.y) + 8; //Correcao de 8 para cetralizar no node..
                        edge.control.X2 = get_X_Win_Pos_From_Mapa_Pos(edge.nB.x) + 8; //Correcao de 8 para cetralizar no node..
                        edge.control.Y2 = get_Y_Win_Pos_From_Mapa_Pos(edge.nB.y) + 8; //Correcao de 8 para cetralizar no node..

                    } else
                    {
                        //Elemento NÃO deve estar desenhado na tela. Se nao estiver, nada fazer. Se estiver, remover.
                        if (MapaWin.Children.Contains(edge.control)) MapaWin.Children.Remove(edge.control);
                    }
                }

                */
            #endregion
        }

        #endregion

        #region Seleção

        public Node selected_node_azul
        {
            get
            {
                var selecionados = geral?.grafo.Nodes.Where(x => x.selecionado_azul);

                if (selecionados != null && selecionados.Count() == 1) return selecionados.First();
                else return null;
            }
        }

        private void click_Remover_Selecoes(object sender, RoutedEventArgs e)
        {
            //Removendo selecao dos Nodes
            geral.grafo.Nodes.ForEach(x => x.selecionado_azul = false);
            geral.grafo.Nodes.ForEach(x => x.selecionado_laranja = false);
            RaisePropertyChanged("selected_node_azul_count");
            RaisePropertyChanged("selected_node_laranja_count");

            //Removendo selecao dos Edges
            geral.grafo.Edges.ForEach(x => x.selecionado_azul = false);
            geral.grafo.Edges.ForEach(x => x.selecionado_laranja = false);
            RaisePropertyChanged("selected_edge_azul_count");
            RaisePropertyChanged("selected_edge_laranja_count");

            redraw_MapaWin();
        }

        public int selected_edge_azul_count
        {
            get { /*RaisePropertyChanged("selected_node_azul");*/ return geral?.grafo.Edges.Where(e => e.selecionado_azul)?.Count() ?? 0; }
        }

        public int selected_node_azul_count
        {
            get { RaisePropertyChanged("selected_node_azul"); return geral?.grafo.Nodes.Where(x => x.selecionado_azul)?.Count() ?? 0; }
        }

        //Atenção, Raise Property Changed com selected_node_laranja so vai fazer alguma ação se tiver algum binding com selected_node_laranja
        //Sem entender isso eu perdi uma hora tentando fazer dar certo e nada...
        public Node selected_node_laranja
        {
            get
            {
                var selecionados = geral?.grafo.Nodes.Where(x => x.selecionado_laranja);

                if (selecionados != null && selecionados.Count() == 1) return selecionados.First();
                else return null;
            }
        }

        public int selected_node_laranja_count
        {
            get { RaisePropertyChanged("selected_node_laranja"); return geral?.grafo.Nodes.Where(x => x.selecionado_laranja)?.Count() ?? 0; }
        }

        private void Redraw_MultiSelect_GUI(double X1, double Y1, double X2, double Y2)
        {
            //Criei essa funcao pq desenhar setando o ponto inicial e o width/height é uma coisa, mas quando o mouse vai pro outro lado
            //Ai passa a ser negativo... Entao preciso de uma funcao pra fazer direito...

            //O menor é que é o left, o outro é width...
            Canvas.SetLeft(MultiSelect_GUI, Math.Min(X1,X2));
            MultiSelect_GUI.Width = Math.Abs(X2 - X1);

            //O menor é que é o top, o outro é height...
            Canvas.SetTop(MultiSelect_GUI, Math.Min(Y2, Y1));
            MultiSelect_GUI.Height = Math.Abs(Y2 - Y1);

        }

        #endregion

        #region Abrir / Salvar /Novo

        private void MenuItem_Novo_Click(object sender, RoutedEventArgs e)
        {
            preparar_gui_novo_geral();
            geral = new Geral();
            RaisePropertyChanged("geral_gui");
            redraw_MapaWin();
        }

        private void preparar_gui_novo_geral()
        {

            //Removendo selecao
            click_Remover_Selecoes(null,null);

            //Tirando ferramente selecionada
            SelectedTool = null;

            //Preparar o que for necessario de GUI para criar um novo geral... como zerar, etc...
            //Removendo todos os nodes e edges e etc... pq se so trocar o geral, vai ficar tudo na tela...
            foreach (var node in geral.grafo.Nodes) { MapaWin.Children.Remove(node.control); MapaWin.Children.Remove(node.control_aurea); }
            foreach (var edge in geral.grafo.Edges) { MapaWin.Children.Remove(edge.control); }

            //Zerando zoom e pan:
            zoom = new Distancia(zoom_default.ToString() + " m", 0, false, 6371000);
            RaisePropertyChanged("zoom_txt"); //Atualizar GUI que mostra o zoom
            center_x_m = 0; //Centro default
            center_y_m = 0; //Centro default
        }

        private void MenuItem_Abrir_Click(object sender, RoutedEventArgs e)
        {
            abrir();
        }

        private void abrir()
        {
            Microsoft.Win32.OpenFileDialog dlg = new Microsoft.Win32.OpenFileDialog();
            dlg.Filter = "Arquivos kLog|*.kLog"; // Filter files by extension

            Nullable<bool> result = dlg.ShowDialog();

            if (result == true)
            {
                var objeto_serial = carregar_arquivo_klog_versao_nova(dlg.FileName);

                if (objeto_serial.tipo_arquivo == 101)
                {
                    preparar_gui_novo_geral();
                    geral = objeto_serial.geral;
                    RaisePropertyChanged("geral_gui");

                    //Reconstruindo todos os controls e o que for necessario da GUI
                    foreach (var node in geral.grafo.Nodes) node.preparar_GUI();
                    foreach (var edge in geral.grafo.Edges) edge.preparar_GUI();

                    //Recarregando vizualização:
                    zoom = objeto_serial.zoom;
                    RaisePropertyChanged("zoom_txt"); //Atualizar GUI que mostra o zoom
                    center_x_m = objeto_serial.center_x_m;
                    center_y_m = objeto_serial.center_y_m;

                    redraw_MapaWin();
                } // else if...
            }
        }

        private void MenuItem_Salvar_Click(object sender, RoutedEventArgs e)
        {
            salvar();
        }

        private void salvar()
        {
            Microsoft.Win32.SaveFileDialog dlg = new Microsoft.Win32.SaveFileDialog();
            dlg.FileName = "Problema"; // Default file name
            dlg.DefaultExt = ".kLog"; // Default file extension
            dlg.Filter = "Arquivos kLog|*.kLog"; // Filter files by extension

            // Show save file dialog box
            Nullable<bool> result = dlg.ShowDialog();

            // Process save file dialog box results
            if (result == true)
            {
                // Save document
                string filename = dlg.FileName;

                salvar_arquivo_klog_versao_nova(
                    new arquivo_klog() {
                        tipo_arquivo = 101, //Salvando normal do geral geral, nao é arquivo especifico de outra coisa...
                        geral = geral, //Setando o problema no arquivo a ser salvo
                        zoom = zoom, //Salvar a vizualiação que estava
                        center_x_m = center_x_m, //Salvar a vizualiação que estava
                        center_y_m = center_y_m //Salvar a vizualiação que estava
                    }, 
                    dlg.FileName); //Local do arquivo
            }
        }

        //Classe generica usada para salvar arquivos
        public class arquivo_klog
        {
            public static int versao = 1; // Versao do programa kLog, porenquanto é sempre 12

            //No futuro, podem existir arquivos .kLog com outros propositos, como arquivos de outros problemas, etc...
            public int tipo_arquivo; // 101 - Arquivo normal, com problema router...

            public Geral geral; //Aqui sera salvo o problema router

            //Visualização. Salvar como estava sendo visto...
            public Distancia zoom;
            public double center_x_m;
            public double center_y_m;
        }

        private arquivo_klog carregar_arquivo_klog_versao_antiga(String local_completo)
        {
            //EDIT: ver o salvar_arquivo_klog_versao_antiga e entender pq esse metodo foi aposentado...
            arquivo_klog arq = new arquivo_klog();

            XmlSerializer deserializer = new XmlSerializer(typeof(arquivo_klog));
            TextReader reader = new StreamReader(local_completo);
            arq = (arquivo_klog)(deserializer.Deserialize(reader));
            reader.Close();

            return arq;
        }

        private arquivo_klog carregar_arquivo_klog_versao_nova(String local_completo)
        {
            arquivo_klog arq = new arquivo_klog();

            var deserializer = new DataContractSerializer(arq.GetType(), null,
                0x7FFF /*maxItemsInObjectGraph*/,
                false /*ignoreExtensionDataObject*/,
                true /*preserveObjectReferences : this is where the magic happens */,
                null /*dataContractSurrogate*/);

            var reader = XmlReader.Create(local_completo);
            arq = (arquivo_klog)(deserializer.ReadObject(reader));
            reader.Close();

            return arq;
        }

        private void salvar_arquivo_klog_versao_antiga(arquivo_klog arq_klog, String local_completo)
        {
            //Ref: http://www.codeproject.com/Articles/483055/XML-Serialization-and-Deserialization-Part

            //EDIT: O problema com esse metodo é que é muito simplorio quando mais de uma mesma referencia existe para um objeto! Ele recriar o objeto varias vezes!!
            //Ver em: http://stackoverflow.com/questions/30733048/serialize-multiple-reference-objects-with-xmlserialize

            XmlSerializer serializer = new XmlSerializer(arq_klog.GetType());

            using (TextWriter writer = new StreamWriter(local_completo))
            {
                serializer.Serialize(writer, arq_klog);
            }
        }

        private void salvar_arquivo_klog_versao_nova(arquivo_klog arq_klog, String local_completo)
        {
            //Precisei criar uma versao nova, que mantinha as referencias dos objetos, do contrario teria que sair criando ID no meio do mundo...
            //Adicione referencias para System.Runtime.Serialization;
            //Ref1 : http://stackoverflow.com/questions/1617528/net-xml-serialization-storing-reference-instead-of-object-copy
            //Ref2: http://stackoverflow.com/questions/30733048/serialize-multiple-reference-objects-with-xmlserialize

            using (var writer = XmlWriter.Create(local_completo)) //Ref: http://stackoverflow.com/questions/15276297/write-out-xmlwriter-to-file
            {
                var serializer = new DataContractSerializer(arq_klog.GetType(), null,
                0x7FFF /*maxItemsInObjectGraph*/,
                false /*ignoreExtensionDataObject*/,
                true /*preserveObjectReferences : this is where the magic happens */,
                null /*dataContractSurrogate*/);

                serializer.WriteObject(writer, arq_klog);
            }
        }

        #endregion

        #region Variados
        private void TextBox_KeyEnterUpdate(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                TextBox tBox = (TextBox)sender;
                BindingExpression binding = BindingOperations.GetBindingExpression(tBox, TextBox.TextProperty);
                if (binding != null) { binding.UpdateSource(); }
            }
        }
        #endregion

        #region GUI Inferior, OUTPUT, etc...

        public void OUT(Object output)
        {
            OUTPUT.AppendText(output.ToString() + Environment.NewLine);
        }

        private void Click_Clear_OUTPUT(object sender, RoutedEventArgs e)
        {
            OUTPUT.Clear();
        }

        #endregion

        #region Menu lateral direito - Parametros
        private void Remover_Node_Click(object sender, RoutedEventArgs e)
        {
            var selecionados = geral.grafo.Nodes.Where(n => n.selecionado_azul).ToList();

            //Se for mais de um, perguntar aqui e remover todos sem alerta, silent...
            if(selecionados.Count > 1)
            {
                if (MessageBoxResult.Yes != MessageBox.Show("Deseja mesmo remover todos os "+selecionados.Count+" vértices e suas arestas?", "Atenção!", System.Windows.MessageBoxButton.YesNoCancel, MessageBoxImage.Warning)) { return; }
                foreach (var n in selecionados) Node.Remover_Node(n, true);
                return;
            }

            //Se for so um ou nenhum, remover alertando..
            foreach (var n in selecionados) Node.Remover_Node(n, false);
        }

        private void Remover_Edge_Click(object sender, RoutedEventArgs e)
        {
            var selecionados = geral.grafo.Edges.Where(n => n.selecionado_azul).ToList();

            if (MessageBoxResult.Yes != MessageBox.Show("Deseja mesmo todas as " + selecionados.Count + " arestas?", "Atenção!", System.Windows.MessageBoxButton.YesNoCancel, MessageBoxImage.Warning)) { return; }

            foreach (var ed in selecionados)
            {
                geral.grafo.Edges.Remove(ed);
                MapaWin.Children.Remove(ed.control);
            }

            App.MW.RaisePropertyChanged("selected_edge_azul_count");
            App.MW.RaisePropertyChanged("selected_edge_laranja_count");

            redraw_MapaWin();

        }

        private void Click_Nodes_Interconectar(object sender, RoutedEventArgs e)
        {
            var selecionados = geral.grafo.Nodes.Where(n => n.selecionado_laranja).ToList();

            foreach (var nodeA in selecionados)
            {
                foreach(var nodeB in selecionados)
                {
                    //Quando nodeB for igual a nodeA, nada fazer, pular
                    if (nodeB == nodeA) continue;

                    //Se ele nao encontrar um edge entre esses dois nodes, adicionar
                    if(geral.grafo.Edges.Where(ed=> (ed.nA == nodeA && ed.nB == nodeB) || (ed.nA == nodeB && ed.nB == nodeA)).FirstOrDefault() == null)
                    {
                        var new_edge = new Edge(nodeA, nodeB, 0);
                        new_edge.selecionado_laranja = true;
                        geral.grafo.Edges.Add(new_edge);
                    }
                }
            }

            //Como seleciono os novos edges criados:
            RaisePropertyChanged("selected_edge_laranja_count");

            redraw_MapaWin();
        }

        #endregion

        #region Calcular / Solvers

        private void Calcular_COG_Otimo(object sender, RoutedEventArgs e)
        {
            //O Cog é resolvido com os nodes laranjas selecionados...
            if(geral.cog_num_cgs == 1)
            {
                Solvers.COG_Otimo_GUI(geral.grafo.Nodes.Where(x => x.selecionado_laranja).ToList(), geral.cog_power_factor, (decimal)geral.cog_solver_precisao, CB_Cog_Conectar_Resultados.IsChecked ?? false);
            }
            else if (geral.cog_num_cgs > 1)
            {
                Solvers.MULTICOG_Clustering(geral.grafo.Nodes.Where(x => x.selecionado_laranja).ToList(), geral.cog_power_factor, (decimal)geral.cog_solver_precisao, geral.cog_num_cgs, CB_Cog_Conectar_Resultados.IsChecked ?? false);
            }
        }
        
        private void Calcular_COG_Especifico(object sender, RoutedEventArgs e)
        {
            var resultado = Solvers.Cog_TC(geral.grafo.Nodes.Where(x => x.selecionado_laranja).ToList(), geral.cog_power_factor, selected_node_azul.x, selected_node_azul.y);
            OUT("Custo Total para o vértice "+ selected_node_azul.texto_para_output() + " é $"+ String.Format("{0:###,###,##0.00}", resultado));
        }

        private void Calcular_Melhor_Rota(object sender, RoutedEventArgs e)
        {
            var node_A_e_B = geral.grafo.Nodes.Where(n => n.selecionado_laranja == true).ToList();

            var solucao = Solvers.find_best_route_Dijkstra(geral.grafo, node_A_e_B[0], node_A_e_B[1]);

            if (solucao == null) { App.MW.OUT("Não existe rota entre os dois nodes selecionados!"); return; }

            //A solucao é um pathN, que sera agora selecionado com vermelho. Primeiro, remover roda a seleção...
            click_Remover_Selecoes(null, null);

            //Desenhar visualmente o path:

            solucao.nodes.ForEach(n => n.selecionado_laranja = true);
            solucao.edges.ForEach(n => n.selecionado_laranja = true);

            //Update GUI:
            RaisePropertyChanged("selected_node_azul_count");
            RaisePropertyChanged("selected_node_laranja_count");
            RaisePropertyChanged("selected_edge_azul_count");
            RaisePropertyChanged("selected_edge_laranja_count");

            redraw_MapaWin();

            /* 
            TESTE/DEBUG DE REACHABLES

            foreach(var node in node_A_e_B)
            {
                OUT("Reachable do " + node.Label + " : ");
                var reachables = Solvers.reachable_nodes_greedy(geral.grafo, node);
                foreach (var n in reachables)
                {
                    OUT("  -- " + n.Label);
                }
            }
            */

        }

        #endregion

    }

    #region Converters 

    //Converter a posicao do node selecionado pro radiobutton correto
    public class NodeLabelPos_To_CheckedRB : IValueConverter
    {

        //ConvertBack: INT to BOOL - Dependendo do int, o RB fica ou nao selecionado
        object IValueConverter.Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            //Manter selecionado somente o RB com o parametro respectivo ao numero da posicao
            if (int.Parse(parameter.ToString()) == (int)value) return true;
            else return false;
        }
        // Convert: BOOL to INT  - Dependendo do radiobutton, tem-se um int de posicao diferente
        object IValueConverter.ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            //Manter selecionado somente o RB com o parametro respectivo ao numero da posicao
            if ((bool)value == true) return int.Parse(parameter.ToString());
            else return null; //Isso pode acontecer, dai ele vira null e em seguida algum vira true e muda
        }
    }

    //Converter true ou false para Visivel/Collapssed
    public class Bool_To_Visibility_Visib_Collapsed_Converter : IValueConverter
    {

        public object Convert(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            return ((bool)value) ? Visibility.Visible : Visibility.Collapsed;
        }

        public object ConvertBack(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            throw new NotSupportedException();
        }

    }

    //Se for maior que um certo valor, entao é true, do contrario é zero.
    public class True_Se_Maior_Ou_Igual_A : IValueConverter
    {

        public object Convert(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            //O parametro é setado direto na GUI
            return ((int)value >= int.Parse(parameter.ToString())) ? true : false;
        }

        public object ConvertBack(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            throw new NotSupportedException();
        }

    }

    //Se for igual a um certo valor, entao é true, do contrario é zero.
    public class True_Se_Igual_A : IValueConverter
    {

        public object Convert(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            //O parametro é setado direto na GUI
            return ((int)value == int.Parse(parameter.ToString())) ? true : false;
        }

        public object ConvertBack(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            throw new NotSupportedException();
        }

    }

    //Muito util para inserir porcentagem desconsiderando se colocou ou nao porcentgem...
    public class Porcentagens : IValueConverter
    {

        public object Convert(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            //Enviando com uma formatacao legal...
            return String.Format("{0:0.00#################}%", ((double)value*100)); //0.01 para 1%
        }

        //Convertendo para double o resultado
        public object ConvertBack(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            //Tentar remover tudo que nao é virgula e repassar... se nao der certo, entao passa o valor que tava que vai dar erro so de validaation...
            try
            {
                return (Double.Parse(Regex.Replace(value.ToString(), "[^0-9,]", "")))/100; //1% para 0.01
            }
            catch (Exception)
            {
                return value;
            }
        }

    }

    #endregion
}


