using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace kLogApp
{
    public class EntryPoint
    {
        //Main
        //Ref: http://stackoverflow.com/questions/6156550/replacing-the-wpf-entry-point

        [STAThread]
        public static void Main(string[] args)
        {

            if (args != null && args.Length > 0)
            {
                // Se quiser implementar args
            }
            else
            {
                try
                {
                    var app = new App();
                    app.InitializeComponent();
                    app.Run();
                }
                catch (Exception ex)
                {
                    //Nao colocar disparar alerta aki, ainda nao tem nenehuma GUI carregada.
                    LIB.logar_exception_e_alertar(ex, "kLog", "Erro no EntryPoint!");
                }
            }
        }
    }
}
