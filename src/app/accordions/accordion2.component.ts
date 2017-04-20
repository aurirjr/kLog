import {Component, Input} from '@angular/core';
import {AppModule} from "../app.module";
import {Problema} from "../Problema";

@Component({
  selector: 'app-accordion2',
  templateUrl: './accordion2.component.html',
  styleUrls: ['./accordion2.component.css']
})
export class Accordion2Component {

  @Input() titulo: string;
  img = "seta_baixo2.png"

  @Input() top: string  = '2px'; //Default é 2, mas pode ser mudado
  @Input() bottom: string  = '2px'; //Default é 2, mas pode ser mudado

  hidden = true;

  public accord_click() {
    this.hidden = !this.hidden;
    if(this.hidden) {
      this.img = "seta_baixo2.png"
    } else {
      this.img = "seta_cima2.png"
    }
  }

}
