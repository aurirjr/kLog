using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace kLogApp
{
    public class Distancia
    {

        public Distancia() { } // Para evitar: cannot be serialized because it does not have a parameterless constructor...

        //Exemplo de testes de regex no powershell:
        //[Regex]::Match("0,05 m","^(\d*[,]?\d+)\s*(m|km|yard)$")

        //Existem diferentes unidades aceitas para distancias. São relacionadas com metro (m) pelos valores abaixo.
        public static Dictionary<String, double> Unidades = new Dictionary<string, double>
        { { "m", 1 }, { "km", 1000 }, { "yard", 0.9144 }, { "mile", 1609.344 } };

        //Toda entrada pela GUI só é uma distancia valida se obedecer:
        //static string regex = @"^(\d*[,]?\d+)\s*(m|km|yard|mile)$";
        //Passei a aceitar numeros negativos. Afinal Distancia pode ser usado para posições no mapa...
        static string regex = @"^\s*([-]?\d*[,]?\d+)\s*(m|km|yard)$";

        //KeyValuePair<string, float> und; // Unidade escolhida das possiveis em Unidades //OLD
        public string und = "m"; //Unidade - Default é m
        public double valor = 0; //Numeral - Default é 0

        //Esta distancia pode ser setada com valores min e maximo
        bool min_inclusivo = true; // Se é um intervalo aberto a esquerda ou fechado - Default é true, fechado
        double? valor_min; //Valor minimo no SI
        bool max_inclusivo = true; // Se é um intervalo aberto a direita ou fechado - Default é true, fechado
        double? valor_max; //Valor maximo no SI

        public Distancia(String d_texto, double? _valor_min = null, bool _min_inclusivo = true, double? _valor_max = null, bool _max_inclusivo = true)
        {
            //Definindo o valor minimo. Opcional.
            if(_valor_min != null)
            {
                valor_min = _valor_min;
                min_inclusivo = _min_inclusivo; //Se nao for colocado como intervalo aberto, fica fechado por default
            }

            //Definindo o valor maximo. Opcional.
            if (_valor_max != null)
            {
                valor_max = _valor_max;
                max_inclusivo = _max_inclusivo;
            }

            distancia_texto = d_texto; //Pelo construtor é possível criar rapidamente a distancia usando string
        }

        public double get_m() //Retorna o valor em metros
        {   
            return Unidades[und]*valor; //Nunca ira retornar null, pois uma Distancia só é criada se for correta
        }

        public string distancia_texto
        {
            get
            {
                return valor.ToString() + " " + und; //Sempre com um espaço
            }
            set
            {
                //Independente da quantidade de espaços que o usuário digitou entre o valor e a unidade,
                //a GUI deve corrigir para Valor_UmEspaço_Unidade. Exemplo: "100 m"
                var r = Regex.Match(value, regex);

                //Se não deu match:
                if (!r.Success)
                {
                    App.MW.alertar(1, "Atenção!", "A distância digitada não foi reconhecida como válida.");
                }
                else
                {
                    //Guardar a distancia e não alterar se houverem limties não respeitados
                    double old_valor = valor;
                    string old_und = und;

                    valor = double.Parse(r.Groups[1].Value); //Testando no powershell, vi que o valor vem sempre no grupo 1. A und no 2.
                    und = r.Groups[2].Value;

                    //Se deu, alterar a distancia. Mas voltar se ela for uma distancia fora dos limites aceitos
                    if (valor_min != null && ((min_inclusivo && !(get_m() >= valor_min)) || (!min_inclusivo && !(get_m() > valor_min))))
                    {
                        App.MW.alertar(1, "Atenção!", "A distância é menor que o valor minimo aceito, de "+valor_min+" m");

                        //Nao alterar os valores
                        valor = old_valor;
                        und = old_und;
                    }
                    else if (valor_max != null && ((max_inclusivo && !(get_m() <= valor_max)) || (!max_inclusivo && !(get_m() < valor_max))))
                    {
                        App.MW.alertar(1, "Atenção!", "A distância é maior que o valor máximo aceito, de " + valor_max + " m");

                        //Nao alterar os valores
                        valor = old_valor;
                        und = old_und;
                    }

                }
            }
        }

    }

    class Tempo
    {
        public Tempo() { } // Para evitar: cannot be serialized because it does not have a parameterless constructor...

        //Existem diferentes unidades aceitas para tempo. São relacionadas com segundo (s) pelos valores abaixo.
        static Dictionary<String, float> Unidades = new Dictionary<string, float>
        { { "s", 1 }, { "m", 60 }, { "h", 3600 }, { "dia", 86400 } };

        KeyValuePair<string, float> und; // Unidade escolhida das possiveis em Unidades
        double valor; //Numeral

        double get_s() //Retorna o valor em metros
        {
            return und.Value * valor;
        }

    }
}
