import {EventEmitter} from "@angular/core";
/**
 * Created by aurir on 17/05/2017.
 */

declare var google: any;

//Adicionando GoogleMapsAPI:
  //APIKEY: AIzaSyAI7zmXJ7GUAer9gQ7bL8S95qVZxIItJvs

//https://developers.google.com/maps/documentation/javascript/tutorial
//EDIT: Carregando tambem as bibliotecas necessarias:  https://developers.google.com/maps/documentation/javascript/libraries
const url = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAI7zmXJ7GUAer9gQ7bL8S95qVZxIItJvs&callback=__onGoogleMapsLoaded&libraries=geometry';

// O google maps só possui 18 lvls de zoom, o que não permite um zoom livre como no kLog...
//https://developers.google.com/maps/documentation/javascript/tutorial#MapOptions
// Portanto, ao ativar a visão do google maps, procurar o zoom mais proximo.
// Em relação ao PAN, o centro inicial do map sempre terá os valores abaixo, e ficará em sync com o kLog.
//Centro inicial em Fortaleza:
export class gMaps {
  public static _mapsApi; //Aqui guardo a api, carregada no componente, com GoogleMapsLoader.load...
  public static gmap; //Aqui guardo o mapa criado pela Api
  public static latInicial = -3.79;
  public static lngInicial = -38.50;
  public static LatLngInicial;
  //Nessa latitude inicial, e nesse zoom_inicial, a funcao abaixo retorna: 610.1588962773312 m/px
  //Assim, é bom eu definir uma escala inicial proxima disso, 610 metros por pixel... No excel, deu algo como 50,643Km/83pixel
  //Claro que, sempre que alterar de Grid/gMaps, o sistema altera o zoom para o zoom de gMaps mais proximo...
  public static get_meters_per_pixel() : number {
    //https://gis.stackexchange.com/questions/7430/what-ratio-scales-do-google-maps-zoom-levels-correspond-to
    return 156543.03392 * Math.cos(this.gmap.getCenter().lat() * Math.PI / 180) / Math.pow(2, this.gmap.getZoom())
  }
  public static carregar_api() {
    //Sempre que carregar a api, criar novo mapa...
    GoogleMapsLoader.load().then((_mapsApi) => {
      gMaps._mapsApi = _mapsApi;
      //Definindo um objeto LatLng util pra ser reutilizado nos pans...
      this.LatLngInicial = new google.maps.LatLng(this.latInicial, this.lngInicial);
      this.api_loaded.emit(null); });
  }
  public static api_loaded : EventEmitter<any> = new EventEmitter<any>();
  public static criar_novo_mapa() {
    this.gmap = new this._mapsApi.Map(document.getElementById('map'), {
      center: {lat: this.latInicial, lng: this.lngInicial},
      zoom: this.zoom_inicial
    });
  }
  public static zoom_inicial = 8; //Sera alterado para o zoom_inicial mais proximo encontrado com procurar_zoom_inicial_mais_proximo
  public static procurar_zoom_inicial_mais_proximo(zf_atual: number) {
    //Varrendo os 18 niveis ate achar o zoom mais proximo do zoom_factor atual
    let diff_atual : number = null;
    let next_diff : number = null;
    let zoom;
    for (zoom = 0; zoom <=18; zoom++) {

      //Calculando uma diferença pra esse nivel...
      next_diff = Math.abs((156543.03392 * Math.cos(this.latInicial * Math.PI / 180) / Math.pow(2, zoom)) - zf_atual);

      //Vendo se ela é menor que a diff atual... Na hora que for maior, então parar, pq a diff atual ja é a menor que consegui...
      if(diff_atual != null && (next_diff > diff_atual)) break;
      else (diff_atual = next_diff);
    }
    //O zoom que pegou a menor diff é o melhor lvl inicial para criar o mapa...
    if(zoom - 1 > 0) this.zoom_inicial = zoom - 1; //Um zoom um nivel acima ver melhor o problema
    else this.zoom_inicial = zoom; //Cuidado so pra nao deixar -1...

  }
  //Quando se usa gMaps, ao contrario do zoom, que é definido no Grid em função do gMaps... O centro é definido no Grid primeiro, e no gMaps em função do Grid...
  //O google carregou com uma latInicial e uma lngInicial, que correspondem a x_m_centro = 0 e y_m_centro = 0;
  //Agora, tenho que especificar novas lat e lng pro gMaps, baseado nos novos x_m_centro e y_m_centro.
  //Para tanto, utilziar:
  //https://developers.google.com/maps/documentation/javascript/3.exp/reference#LatLng
  //computeOffset(from:LatLng, distance:number, heading:number, radius?:number) {
  //Return Value:  LatLng. Returns the LatLng resulting from moving a distance from an origin in the specified heading (expressed in degrees clockwise from north).
  public static recalcular_centro(x_m_c: number, y_m_c: number) {
    this.gmap.setCenter(
      new google.maps.LatLng(
        //Latitude. A partir de x_m 0 e y_m 0, que eram os latlng inicias... Somando a nova distancia vertical (y_m_c), para o norte ( 0 graus )
        google.maps.geometry.spherical.computeOffset(this.LatLngInicial, y_m_c, 0).lat(), //Lat
        //Longitude.A partir de x_m 0 e y_m 0, que eram os latlng inicias... Somando a nova distancia horizontal(x_m_c_, para o leste ( 90 graus )
        google.maps.geometry.spherical.computeOffset(this.LatLngInicial, x_m_c, 90).lng() //Lng
      )
    );
  }
}


//Mesmo que o usuario realize vários pans em Grid, quando carregar o gMaps, o posicionamento é o correto.

//Tirado do stackoverflow. Perdi o link.
export class GoogleMapsLoader {
  private static promise;

  public static load() {

    // First time 'load' is called?
    if (!GoogleMapsLoader.promise) {

      // Make promise to load
      GoogleMapsLoader.promise = new Promise((resolve) => {

        // Set callback for when google maps is loaded.
        window['__onGoogleMapsLoaded'] = (ev) => {
          console.log('google maps api loaded');
          resolve(window['google']['maps']);
        };

        // Add script tag to load google maps, which then triggers the callback, which resolves the promise with windows.google.maps.
        console.log('loading..');
        let node = document.createElement('script');
        node.src = url;
        node.type = 'text/javascript';
        document.getElementsByTagName('head')[0].appendChild(node);
      });
    }

    // Always return promise. When 'load' is called many times, the promise is already resolved.
    return GoogleMapsLoader.promise;
  }
}

//TERRA REDONDA: Por um breve momento, pensei que Grid e gMaps teriam uma correlação entre os posicionamentos, que é justamente o problema MILES do Logware...
//Com isso eu iria ter que calcular posicionamentos diferentes na tela, pra visualização em grid ou gMap...
//Mas depois percebi que o gMap é flat, é linear ja... Os pontos, as distancias....
//Boa leitura sobre isso: https://www.quora.com/How-does-Google-Maps-calculate-the-distance-from-one-place-to-another
//Provavelmente o google inplemtna o Haversine, mas tambem tem um codigo em JS nessa pagina ai...

