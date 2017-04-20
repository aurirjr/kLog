using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace kLogApp
{
    public class LIB //Classe que guarda vários métodos úteis.
    {

        #region Logs de erros


        //Recurrencia InnetException
        public static String analisar_inner_exp(dynamic ex, int i, int limite) //r é o output, i é onde começa (1).
        {

            String retorno = "";
            
            if (ex.InnerException != null)
            {
                retorno += "-- InnerException " + i + ": " + Environment.NewLine;
                retorno += get_exp_info(ex.InnerException);

                i = i + 1; //Proxima

                if (i <= limite) { retorno += analisar_inner_exp(ex.InnerException, i, limite); } //Envia para a proxima, ate parar
            }

            return retorno;               
        }

        //, MainWindowAleradora MWA
        public static String logar_exception_e_alertar(dynamic ex, String NomeApp, String MsgExtra)
        {
            String r = "";

            try
            {
                r += " [" + DateTime.Now + "] [" + Environment.UserName + "] " + NomeApp + " " + MsgExtra + " " + Environment.NewLine;

                r += "- Exception: " + Environment.NewLine;

                r += get_exp_info(ex);

                //Se houver innetexceptions, analisar.
                r += analisar_inner_exp(ex, 1, 30); //Fundo ate no maximo 30...

                //Alertar GUI

                //if (MWA != null)
                //{
                //    ((Window)MWA).Dispatcher.Invoke((Action)(() => { MWA.alert(r); })); //Alertar na GUI
                //}

                //Salvar arquivo

                //Crio um arquivo para cada PC e usuário, já que o arquivo será salvo na rede e pode ser usado de vários PCS e usuários.
                //Então crio bem separado para não correr o risco de dois tentarem acessar o arquivo ao mesmo tempo.
                try
                {
                    TextWriter file = new StreamWriter("LOG_" + NomeApp + "_" + Environment.MachineName + "_" + Environment.UserName + ".kLogER", true);
                    file.Write(r + "\n");
                    file.Close();
                }
                catch (Exception exy)
                {
                    Console.WriteLine("ERRO AO SALVAR ARQUIVO DE LOG!");
                    Console.WriteLine(get_exp_info(exy));
                    Console.WriteLine("-----Msgs da exp original: ----");
                    Console.WriteLine(r);
                }

                Console.WriteLine(r);

                return r; //Pode ser usado em alguma janela para outros objetivos.

            }
            catch (Exception exz)
            {
                Console.WriteLine("ERRO AO GERAR LOG:");
                Console.WriteLine(get_exp_info(exz));
                Console.WriteLine("-----Msgs da exp original: ----");
                Console.WriteLine(r);
            }

            return r;
        }

        //Adicionari infos de uma exp.
        private static String get_exp_info(dynamic ex)
        {
            String r = "";

            try
            {
                //Informações GENERICAS:

                r += ex.GetType() + Environment.NewLine;
                r += ex.Source + Environment.NewLine;
                r += ex.Message + Environment.NewLine;
                r += ex.StackTrace + Environment.NewLine;

                return r;
            }
            catch (Exception exxx)
            {
                Console.WriteLine("ERRO AO TENTAR PEGAR INFOS DA EXCEPTION");
                Console.WriteLine(exxx.Message);
                return r;
            }

        }
        #endregion

        //Referencia: http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
        public static double Menor_Distancia_Ponto_A_Segmento(double x, double y, double x1, double y1, double x2, double y2)
        {

            var A = x - x1;
            var B = y - y1;
            var C = x2 - x1;
            var D = y2 - y1;

            var dot = A * C + B * D;
            var len_sq = C * C + D * D;
            double param = -1;
            if (len_sq != 0) param = dot / len_sq; //in case of 0 length line

            double xx, yy;

            if (param < 0)
            {
                xx = x1;
                yy = y1;
            }
            else if (param > 1)
            {
                xx = x2;
                yy = y2;
            }
            else {
                xx = x1 + param * C;
                yy = y1 + param * D;
            }

            var dx = x - xx;
            var dy = y - yy;

            return Math.Sqrt(dx * dx + dy * dy);
        }

    }
}
