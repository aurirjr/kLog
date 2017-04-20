import { BrowserModule } from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { A } from './app.component';
import { Accordion1Component } from './accordions/accordion1.component';
import { Accordion2Component } from './accordions/accordion2.component';
import { ToolComponent } from './tools/tool.component';
import {InputDistanciaDirective, InputDistanciaPipe} from "./pipe_directives_services/input-distancia.pipe.directive";

@NgModule({
  declarations: [
    A,
    Accordion1Component,
    Accordion2Component,
    ToolComponent,
    InputDistanciaDirective,
    InputDistanciaPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [],
  entryComponents: [A],
  bootstrap: [A]
})
export class AppModule{}
