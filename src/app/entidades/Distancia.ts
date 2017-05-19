//Toda distancia tem um valor, em metros, e uma unidade onde ela esta sendo apresentada...

export class Distancia {

  /*Se setar o numeral e a unidade ao mesmo tempo, o sistema calcula o n_m (em metros)*/
  /*Se setar somente o numeral, o sistema calcula um novo n_m pra mesma unidade*/
  /*Se setar somente a unidade, o sistema calcula um novo x pra manter o n_m na mesma unidade...*/
  /*Se seta o n_m, o sistema calcula um x para a unidade atual... */

  //Definindo o numeral da distancia, o que ja calcula o valor, em n_m, em funcao da unidade...
  private ___n : number; //Distancia de acordo com a unidade
  get n(): number{ return this.___n; }
  set n(n: number)
  {
    this.___n = n;
    this.recalcular___n_m();
  }
  //Builder pattern
  public _n(n: number): Distancia { this.n = n; return this; }

  //Definindo a unidade, o que ja calcula o valor, em n_m, em funcao da unidade...
  private ___und : string = 'm'; //O default de distancia é m, mas pode ser alterada
  get und(): string { return this.___und; }
  set und(und: string)
  {
    this.___und = und;
    this.recalcular_n();
  }
  //Builder pattern de und
  public _und(und: string): Distancia { this.und = und; return this; }

  //Definido numeral e unidade ao mesmo tempo, builder pattern:
  _n_und(x:number, und: string)
  {
    this.___n = x;
    this.___und = und;
    this.recalcular___n_m();
    return this;
  }

  recalcular___n_m() {
    //Definindo a distancia em metros, n_m
    if(this.und == 'm') this.___n_m = this.n;
    else if(this.und == 'km') this.___n_m = this.n*1000;
  }

  recalcular_n() {
    //Defininfo x a partir de n_m
    if(this.und == 'm') this.n = this.___n_m;
    else if(this.und == 'km') this.n = this.___n_m/1000;
  }

  //Distancia em metros, que é o valor utilizado na logica do problema
  //Definindo o n_m, que ja calcula o valor de x é funcao da unidade
  private ___n_m : number;
  get n_m() : number { return this.___n_m; }
  set n_m(n_m: number)
  {
    this.___n_m = n_m;
    this.recalcular_n();
  }
  //Builder pattern de und
  public _n_m(n_m: number): Distancia { this.n_m = n_m; return this; }

}
