import {A} from "../app.component";

export class FG1{

  //X_S refere-se sempre as coordenadas na SCREEN, no svg, em pixel.
  //X_M refere-se sempre as coordenadas no MAPA, no problema, em metros.

  public static get_x_s_from_x_m(x_m) {
    return A.a.x_s_middle_center + (x_m - A.a.x_m_centro) / A.a.zoom_fator;
  }

  static get_y_s_from_y_m(y_m: number) {
   return A.a.y_s_middle_center - ((y_m - A.a.y_m_centro) / A.a.zoom_fator);
  }

  static get_x_m_from_x_s(x_s: number) {
    return (x_s - A.a.x_s_middle_center) * A.a.zoom_fator + A.a.x_m_centro;
  }

  static get_y_m_from_y_s(y_s: any) {
    return (A.a.y_s_middle_center - y_s) * A.a.zoom_fator + A.a.y_m_centro;
  }
}
