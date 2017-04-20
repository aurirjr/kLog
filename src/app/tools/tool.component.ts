import {Component, Input} from '@angular/core';
import {Problema} from "../Problema";
import {A} from "../app.component";

@Component({
  selector: 'app-tool',
  template: `
    <div (click)="selecionar_tool()">
        <img class="tool" src="../assets/img/tools/{{nome_tool}}.png" [ngClass]="{'tool_selecionada': is_selected, 'tool_nao_selecionada': !is_selected}">
    </div>
`,
  styles: [`
  
  .tool {
    padding: 3px 5px;
    border: 1px solid rgb(112,112,112);
  }
  .tool:hover { /*Nao funfa muito bem com ngStyle...*/
  background: rgb(190,230,253);
  }
  .tool_selecionada {
    background: rgb(144,238,144);
  }
  .tool_nao_selecionada {
    background: white;
  } 
  
  
`]
})
export class ToolComponent {

  @Input() public nome_tool: string;

  //bg: string = "white"; /*Default é branco*/
  is_selected: boolean = false;

  //Uma tool pode ser selecionavel, ou causar outra acao...
  @Input() public selecionavel: boolean = true; //Por default, selecionavel

  selecionar_tool()
  {
    if(this.selecionavel) {
      //Tirar a selecao da tool que estava selecionada...
      if(A.a.selected_tool != null) {
        A.a.selected_tool.deselecionar_tool();
      }

      A.a.selected_tool = this;

      this.is_selected = true;
    }
  }

  deselecionar_tool()
  {
    this.is_selected = false;
  }
}
