using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Markup;

namespace kLogApp
{
    public partial class App : Application
    {

        static public App A; //Referencia para o objeto desse App.
        static public MainWindow MW; //Referencia para a mainwindow

        public App()
        {

            setar_cultura();

            A = this;

            carregar_cursores();
        }

        #region Cursores

        public Cursor Cur_AddNode;
        public Cursor Cur_AddEdge;
        public Cursor Cur_MoveNode;
        public Cursor Cur_MultiSelectAzul;
        public Cursor Cur_MultiSelectLaranja;

        private void carregar_cursores()
        {
            // Para colocar cursor no XAML, basta usar: Cursor = "imgs/Cursors/AddNode.cur"
            Cur_AddNode = new Cursor(Application.GetResourceStream(new Uri("imgs/Cursors/Add_Node.cur", UriKind.Relative)).Stream);
            Cur_MoveNode = new Cursor(Application.GetResourceStream(new Uri("imgs/Cursors/MoveNode.cur", UriKind.Relative)).Stream);
            Cur_MultiSelectAzul = new Cursor(Application.GetResourceStream(new Uri("imgs/Cursors/MultiSelect.cur", UriKind.Relative)).Stream);
            Cur_MultiSelectLaranja = new Cursor(Application.GetResourceStream(new Uri("imgs/Cursors/MultiSelectLaranja.cur", UriKind.Relative)).Stream);
            Cur_AddEdge = new Cursor(Application.GetResourceStream(new Uri("imgs/Cursors/AddEdge.cur", UriKind.Relative)).Stream);
        }
        #endregion

        public void setar_cultura() // Utilizar como primeira linha do MW.
        {
            //Fonte: http://serialseb.blogspot.com.br/2007/04/wpf-tips-1-have-all-your-dates-times.html

            //## METODO ANTIGO ## Util pois define o currency format pegando do sistema

            FrameworkElement.LanguageProperty.OverrideMetadata(
                typeof(FrameworkElement),
                new FrameworkPropertyMetadata(
                    XmlLanguage.GetLanguage(CultureInfo.CurrentCulture.IetfLanguageTag)));

            // ## METODO NOVO ## Funcionou otimo com DatePickers.##

            //Ref: http://stackoverflow.com/questions/9908096/how-to-localize-a-datepicker

            var cultura = new CultureInfo("pt-BR")
            {
                DateTimeFormat = new DateTimeFormatInfo() { ShortDatePattern = "dd/MM/yy" }
            };

            Thread.CurrentThread.CurrentCulture = cultura;
            Thread.CurrentThread.CurrentUICulture = cultura;
        }
    }
}
