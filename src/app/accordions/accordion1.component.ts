import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-accordion1',
  templateUrl: 'accordion1.component.html',
  styleUrls: ['accordion1.component.css']
})
export class Accordion1Component{

  @Input() titulo: string;
  img = "seta_baixo1.png"

  hidden = true;

  public accord_click() {
    this.hidden = !this.hidden;
    if(this.hidden) {
      this.img = "seta_baixo1.png"
    } else {
      this.img = "seta_cima1.png"
    }
  }

}
