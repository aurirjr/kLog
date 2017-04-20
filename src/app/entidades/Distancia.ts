//Toda distancia tem um valor, em metros, e uma unidade onde ela esta sendo apresentada...

export class Distancia {

  //Definindo o numeral da distancia, o que ja calcula o valor, em x_m, em funcao da unidade...
  private ___x : number; //Distancia de acordo com a unidade
  get x(): number{ return this.___x; }
  set x(x: number)
  {
    this.___x = x;
    this.recalcular_x_m();
  }
  //Builder pattern
  public _x(x: number): Distancia { this.x = x; return this; }

  //Definindo a unidade, o que ja calcula o valor, em x_m, em funcao da unidade...
  public ___und : string = 'm'; //O default de distancia é m, mas pode ser alterada
  get und(): string { return this.___und; }
  set und(und: string)
  {
    this.___und = und;
    this.recalcular_x_m();
  }

  recalcular_x_m() {

    //Definindo a distancia em metros, x_m
    if(this.und == 'm') this._x_m = this.x;
    else if(this.und == 'km') this._x_m = this.x*1000;

  }
  //Builder pattern de und
  public _und(und: string): Distancia { this.und = und; return this; }

  //Distancia em metros, que é o valor utilizado na logica do problema
  //So pode ser alterada alterando-se x ou und
  private _x_m : number;

  //Coloquei em forma de get, pra funcionar legal com property biding!
  //public get_x_m() {return this.x_m; }
  get x_m() : number { return this._x_m; }

}
