import {EventEmitter} from "@angular/core";
/**
 * Created by aurir on 17/05/2017.
 */

//Adicionando GoogleMapsAPI:
  //APIKEY: AIzaSyAI7zmXJ7GUAer9gQ7bL8S95qVZxIItJvs

//https://developers.google.com/maps/documentation/javascript/tutorial
const url = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAI7zmXJ7GUAer9gQ7bL8S95qVZxIItJvs&callback=__onGoogleMapsLoaded'

// O google maps só possui 18 lvls de zoom, o que não permite um zoom livre como no kLog...
//https://developers.google.com/maps/documentation/javascript/tutorial#MapOptions
// Portanto, ao ativar a visão do google maps, procurar o zoom mais proximo.
// Em relação ao PAN, o centro inicial do map sempre terá os valores abaixo, e ficará em sync com o kLog.
//Centro inicial em Fortaleza:
export class gMaps {
  public static _mapsApi; //Aqui guardo a api, carregada no componente, com GoogleMapsLoader.load...
  public static gmap; //Aqui guardo o mapa criado pela Api
  public static latCenter = -3.79;
  public static lngCenter = -38.50;
  public static zoom = 8;
  public static get_meters_per_pixel() : number {
    //https://gis.stackexchange.com/questions/7430/what-ratio-scales-do-google-maps-zoom-levels-correspond-to
    return 156543.03392 * Math.cos(this.gmap.lat() * Math.PI / 180) / Math.pow(2, this.zoom)
  }
  public static carregar_api() {
    //Sempre que carregar a api, criar novo mapa...
    GoogleMapsLoader.load().then((_mapsApi) => { gMaps._mapsApi = _mapsApi; this.criar_novo_mapa(); });
  }
  public static api_loaded : EventEmitter<any> = new EventEmitter<any>();
  public static criar_novo_mapa() {
    this.gmap = new this._mapsApi.Map(document.getElementById('map'), {
      center: {lat: this.latCenter, lng: this.lngCenter},
      zoom: this.zoom
    });
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

