import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-accordion1',
  templateUrl: 'accordion1.component.html',
  styleUrls: ['accordion1.component.css']
})
export class Accordion1Component{

  @Input() titulo: string;

  hidden = true;

  public accord_click() {
    this.hidden = !this.hidden;
  }

}
