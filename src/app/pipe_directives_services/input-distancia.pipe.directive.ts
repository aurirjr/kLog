import {Directive, EventEmitter, Input, Output, Pipe, PipeTransform} from "@angular/core";
import {FormControl, NG_VALIDATORS} from "@angular/forms";
import {Distancia} from "../entidades/Distancia";

//Aqui eu defini o pipe, e ele é necessario para pegar o valor de origem e colocar em uma forma de texto visival
@Pipe({
  name: 'input_distancia'
  //pure: false //Pensei em usar, pois a mudanca da variavel interna da distancia nao altera a referencia da distancia...
  //Mas coloquei um console.log dentro de transform, e pqp, o pipe é recalculado O TEMPO TODO em qualquer evento do svg...
  //Sinceramente, nao da pra trabalhar com pipes impuros...
})
export class InputDistanciaPipe implements PipeTransform {

  transform(value : Distancia): string {
    if(value==null || isNaN(value.n)) return null;
    else return (''+value.n).replace('.',',')+value.und;
  }
}
@Directive({
  selector: '[ngModel][input-distancia]', //Tem que ter ngModel e input-distancia na mesma tag
  host: {
    "(input)": 'onInputChange($event)'
  },
  //providers: [NgModel] //Pode-se acessar o NgModel por aqui, basta dar injection: private _ngModel: NgModel
    providers: [
     { provide: NG_VALIDATORS, useExisting: InputDistanciaDirective, multi: true }
    ]
})
export class InputDistanciaDirective {

  constructor () {}

  @Input('input-distancia') dist : Distancia;
  @Input('only_positive') only_positive : boolean = true; //Sendo true, nao permite zero e negativos...

  //Senti a necessidade de criar isso, pois ao alterar o valor dentro do zoom, precisava disparar um refresh dos graficos...
  //Mas nao queria colocar nada especifico de zoom aqui, ja que isso é uma classe gerenerica para definir toda e qualquer distancia...
  @Output('do_after_change') do_after_change = new EventEmitter();

  onInputChange($event){

    //Se bater com o regex_zero e only_positive for true, entao retornar erro
    if(this.only_positive && this.regex_zero.test($event.target.value)) return;

    //http://stackoverflow.com/questions/432493/how-do-you-access-the-matched-groups-in-a-javascript-regular-expression
    let groups = this.regex.exec($event.target.value);

    if(groups != null) {

      let temp_number : number;

      temp_number = parseFloat(groups[1].replace(',','.'));

      if(isNaN(temp_number)) this.dist.n = null;
      else this.dist.n = temp_number;

      this.dist.und = groups[2];

      this.do_after_change.emit();
    }
  }

  //Permitindo ate 3 casas decimais
  regex = /^\s*(\d+[,]?\d{0,3})\s*(m|km|yard)\s*$/; //Regex em JavaScript é assim...
  regex_zero = /^\s*[0]*[,]?[0]*(m|km|yard)\s*$/; //Regex se for so zero...

  validate(c: FormControl): {[s: string]: boolean} {

    //Se bater com o regex_zero e only_positive for true, entao retornar erro
    if(this.only_positive && this.regex_zero.test(c.value)) return {"x": true};

    //Se o valor é null ou passou no teste do regex, então retornar null, que é validado!
    if(c.value ==null || this.regex.test(c.value)) return null;
    //Do contrario, retornar qualquer coisa invalidando...
    return {"x": true}; //Retorno qualquer JSON com um value true pra indicar um erro...

  }
}
