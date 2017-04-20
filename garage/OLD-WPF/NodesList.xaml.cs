using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace kLogApp
{
    //O DataContext de cada linha da lista é um objeto do tipo abaixo...

   class NodeList_Linha
    {

        //Cada node guarda seu X e Y em metros... A unidade nao aparece nessa lista, entao a unidade é sempre a do topo da lista...
        //Default é metros...

        Node _node;
        public Node node
        {
            get
            {
                if(_node == null)
                {
                    //Se o node nao existe, entao essa chamada esta sendo feito em uma linha nova...
                    //Adicionar o node ao grafo e aqui...
                    _node = new Node(0, 0);
                    App.MW.geral.grafo.Nodes.Add(_node);

                    return _node;
                }
                else
                {
                    return _node;
                }
            }
            set
            {
                _node = value;
            }
        }

        public String texto_Nome
        {
            get { return node.Label; }
            set { node.Label = value; }
        }
        public double texto_X
        {
            get
            {
                //Retornar sempre um valor em funcao da unidade escolhida la em cima...
                return node.x / NodesList._unidade_escolhida.Value; //Sempre divide para transformar de m para a unidade...
            }
            set
            {
                node.x = value * NodesList._unidade_escolhida.Value; //Sempre multiplica para transformar da unidade para m...
            }
        }

        public double texto_Y
        {
            get
            {
                //Retornar sempre um valor em funcao da unidade escolhida la em cima...
                return node.y / NodesList._unidade_escolhida.Value; //Sempre divide para transformar de m para a unidade...
            }
            set
            {
                node.y = value * NodesList._unidade_escolhida.Value; //Sempre multiplica para transformar da unidade para m...
            }
        }

        public SolidColorBrush cor_linha
        {
            get
            {
                if (node.selecionado_azul) return Brushes.LightBlue;
                else return Brushes.White;
            }
        }

    }

    public partial class NodesList : Window, INotifyPropertyChanged
    {

        public event PropertyChangedEventHandler PropertyChanged;
        public void RaisePropertyChanged(String caller)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(caller));
            }
        }

        List<NodeList_Linha> item_source_DG;

        bool impedir_de_fechar_a_janela_de_vertices = false;

        public static KeyValuePair<String, double> _unidade_escolhida = Distancia.Unidades.Where(x => x.Key == "m").First(); //m é default
        public static String unidade_escolhida // É satic para ser facilmente acessada de um NodeList_Linha...
        {
            get
            {
                return _unidade_escolhida.Key;
            }
            set
            {
                String und_sem_espacos = value.Trim();
                //Somente serao aceitar unidades possiveis em Distancia...
                if(!Distancia.Unidades.Keys.Contains(und_sem_espacos))
                {
                    App.MW.alertar(1, "Atenção!", "A unidade digitada não foi reconhecida como válida.");
                }
                else
                {
                    _unidade_escolhida = Distancia.Unidades.Where(x => x.Key == und_sem_espacos).First();
                }
            }
        }

        public bool _usar_params_CG = false; //Comeca como false
        public bool usar_params_CG
        {
            get { return _usar_params_CG; } set { _usar_params_CG = value;  RaisePropertyChanged("usar_params_CG"); }
        }

        private void Unidade_KeyUp(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                (sender as TextBox).RaiseEvent(new RoutedEventArgs(LostFocusEvent)); //Faz perder o focus... Dai atualiza o zoom
            }
        }

        public NodesList()
        {
            InitializeComponent();
        }

        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {

            /* Testando, percebi que a combinação das 3 linhas abaixo é justamente o que permite
            fechar a janela de NodeList e manter o valor que estava em edição. */
            DG.CommitEdit();
            DG.RaiseEvent(new RoutedEventArgs(UIElement.LostFocusEvent));
            DG.CommitEdit();

            e.Cancel = true; //Fechar nunca tem efeito nenhum.

            this.Visibility = Visibility.Hidden; //Escondendo
                     

            App.MW.Activate();

        }

        private void Window_Deactivated(object sender, EventArgs e)
        {
            if (impedir_de_fechar_a_janela_de_vertices == false)
            {
                this.Visibility = Visibility.Hidden; //Escondendo

                //Se ficou no meio de uma edição e nao apertou enter, submeter:
                //DG.RaiseEvent(new LostFocu);

                App.MW.redraw_MapaWin(); //Redesenhar o mapa...

                App.MW.Activate(); 
            }
        }

        //Recarregando o DG com os nodes...
        private void Reload_DG()
        {
            item_source_DG = new List<NodeList_Linha>();

            foreach (var _node in App.MW.geral.grafo.Nodes)
            {
                item_source_DG.Add(new NodeList_Linha() { node = _node });
            }

            DG.ItemsSource = item_source_DG;
        }

        private void Window_Activated(object sender, EventArgs e)
        {
            //Sempre que abrir essa janela, carregar todos os nodes em uma lista...
            Reload_DG();
        }

        private void Button_Click_Remover_Linha(object sender, RoutedEventArgs e)
        {
            if(((sender as Button).Tag as NodeList_Linha) == null) { return; } //Nao se faz nada ao tentar apagar a linha de adicionar...

            var node_sel = ((sender as Button).Tag as NodeList_Linha).node;

            impedir_de_fechar_a_janela_de_vertices = true; //Se nao a janela sai quando o mesage box aparecer...

            Node.Remover_Node(node_sel, false);

            //Recarregando tabela:
            Reload_DG();

            //Voltar ao comportamento normal
            impedir_de_fechar_a_janela_de_vertices = false;
        }
    }

    // Para acessar o DataContext, a partir de certo elementos que não fazem parte da Visual Tree, é preciso um hack usando Freezable.
    // Existe outra técnica que testei e não funcionou, por isso uso o Freezable
    // Muito bem explicado aqui: http://stackoverflow.com/questions/22073740/binding-visibility-for-datagridcolumn-in-wpf
    // Falta explicar ai que, para funcionar usar DPs aqui, é preciso DataContext="{Binding RelativeSource={RelativeSource Self}}" // http://stackoverflow.com/questions/12430615/datacontext-and-binding-self-as-relativesource
    public class BindingProxy : Freezable
    {
        #region Overrides of Freezable

        protected override Freezable CreateInstanceCore()
        {
            return new BindingProxy();
        }

        #endregion

        public object Data
        {
            get { return (object)GetValue(DataProperty); }
            set { SetValue(DataProperty, value); }
        }

        public static readonly DependencyProperty DataProperty =
            DependencyProperty.Register("Data", typeof(object),
                                         typeof(BindingProxy));
    }

}
