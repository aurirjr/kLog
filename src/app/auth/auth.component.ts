import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Problema, ProblemaService} from "../Problema";
import {Graph} from "../entidades/Graph";
import {Text} from "../entidades/Text";
import {Edge} from "../entidades/Edge";
import {Node} from "../entidades/Node";
import {A} from "../app.component";
import {Distancia} from "../entidades/Distancia";
import {gMaps} from "../GoogleMaps";

declare var $: any;
declare var firebase: any;
/*declare var firebaseui: any;*/

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  /* TUDO RELACIONADO A FIREBASE É MANTIDO AQUI - Inclusive Database*/

  public status_logado : boolean;

  //VARIAVEIS FIREBASE -------------------------
  public displayName : string = '';
  public email : string = '';
  public emailVerified : boolean;
  public photoURL : string = '';
  public uid : string = '';
  public accessToken : string = '';
  //providerData;
  //--------------------------------------------

  constructor(private _CD : ChangeDetectorRef, public _P : ProblemaService) {

    this.status_logado = true;

  }

  provider;

  ngOnInit() {

    // Initialize Firebase
    var config = {
      apiKey: "AIzaSyDgILMHURXgxF4G2YWJyo8yW7_xrVQOpYQ",
      authDomain: "klog-aa402.firebaseapp.com",
      databaseURL: "https://klog-aa402.firebaseio.com",
      projectId: "klog-aa402",
      storageBucket: "klog-aa402.appspot.com",
      messagingSenderId: "460062597721"
    };
    firebase.initializeApp(config);

    // FirebaseUI config.
    var uiConfig = {
      //signInSuccessUrl: '<url-to-redirect-to-on-success>',
      signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID//,
//        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
//        firebase.auth.TwitterAuthProvider.PROVIDER_ID,
//        firebase.auth.GithubAuthProvider.PROVIDER_ID,
//        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ]//,
      // Terms of service url.
      //tosUrl: '<your-tos-url>'
    };

    this.provider = new firebase.auth.GoogleAuthProvider();

    //Preferi criar minha propria UI!
    // // Initialize the FirebaseUI Widget using Firebase.
    // var ui = new firebaseui.auth.AuthUI(firebase.auth());
    // // The start method will wait until the DOM is loaded.
    // ui.start('#firebaseui-auth-container', uiConfig);

    //Configurando evento de mudanca de status do firebase
    firebase.auth().onAuthStateChanged( (user) => {
      if (user) {
        // User is signed in.
        this.displayName = user.displayName;
        this.email = user.email;
        this.emailVerified = user.emailVerified;
        this.photoURL = user.photoURL;
        this.uid = user.uid;
        //this.providerData = user.providerData;
        this.status_logado = true;

        //COMO [HIDDEN] TAVA MEIO BUGADO, DISPARO MANUALMENTE CHANGE DETECTION
        //Nao posso usar ngIf, pois preciso da referencia do div pra usar aqui com ui.start
        //EDIT: COLOQUEI NG IF MESMO ASSIM PRECISA DISSO!
        this._CD.detectChanges();

        //Pegando o token de acesso
        user.getToken().then( (accessToken) => {
          this.accessToken = accessToken;
          this.configuracao_inicial_db();
        });
      } else {
        this.status_logado = false;
        //COMO [HIDDEN] TAVA MEIO BUGADO, DISPARO MANUALMENTE CHANGE DETECTION
        //Nao posso usar ngIf, pois preciso da referencia do div pra usar aqui com ui.start
        //EDIT: COLOQUEI NG IF MESMO ASSIM PRECISA DISSO!
        this._CD.detectChanges(); //EDIT: PAREI DE USAR HIDDEN
      }
    }, (error) => {
      console.log(error);
    });

  }

  logoff() {
    firebase.auth().signOut();
  }

  logar() {
    firebase.auth().signInWithRedirect(this.provider);
    this.status_logado = false;
  }

  show_modal() {
    $('#modal-auth').modal('show');
  }



  Problemas_Users : Array<Problema> = [];

  users_db_ref;
  configuracao_inicial_db()
  {

    this.users_db_ref = firebase.database().ref('problemas_users/'+this.uid);

    //Essa funcao vai ser chamada a cada novo problema adicionado, bem como nos problemas inicias ao realizar login
    this.users_db_ref.on('child_added', (data) => {
      this.Problemas_Users.push(data.val());
      this._CD.detectChanges();
    });

    this.users_db_ref.on('child_changed', (data) => {
      //Quando salvor algo, tambem alterar aqui na listagem... Se abrir denovo, ja vem atualizado
      for(let k = 0; k < this.Problemas_Users.length; k++) {
        if(this.Problemas_Users[k].titulo == data.val().titulo) {
          this.Problemas_Users[k] = data.val();
          break;
        }
      }
    });

    this.users_db_ref.on('child_removed', (data) => {
      //Quando remover algo, atualizar na listagem.
      for(let k = 0; k < this.Problemas_Users.length; k++) {
        if(this.Problemas_Users[k].titulo == data.val().titulo) {
          this.Problemas_Users.splice(k,1);
          break;
        }
      }
    });
  }

  deletar_pro(pro: Problema) {
    firebase.database().ref('problemas_users/'+this.uid+'/'+pro.titulo).remove();
  }

  abrir_pro(pro: Problema) {

    this._P.p = this.processar_problema_salvar_ou_abrir(pro,false);

    //Se tiver com gmaps ligado, e um mapa carregado, entao
    if(A.a.gmaps_onoff && gMaps.gmap != null) {
      gMaps.procurar_zoom_inicial_mais_proximo(this._P.p.zoom_fator);
      //Setando o melhor zoom para o zoom que foi salvo...
      gMaps.gmap.setZoom(gMaps.zoom_inicial);
    }

    //Ja que foi redefinido zoom e centros, recalcular tudo...
    A.a.zoom_or_center_changed();

    this._CD.detectChanges();

  }

  salvar_pro() {
    //No minimo 2 caracteres pro nome do problema
    if(this._P.p.titulo.length <= 2) return;

    let problema_a_salvar : Problema = this.processar_problema_salvar_ou_abrir(this._P.p,true);

    //console.log(problema_a_salvar);

    //Salvando:
    firebase.database().ref('problemas_users/'+this.uid+'/'+this._P.p.titulo).set(problema_a_salvar);
  }

  //s_a true é Salvar! s_a false é Abrir!
  processar_problema_salvar_ou_abrir(p_in : Problema, s_a : boolean):Problema {

    /* Utilizava bastante $.extend, mas gostei bastante de Object.assign
    * Ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    * Para salvar, nao copiar as funcoes, pq se nao dar erro... E para abrir, copiar as variaveis para objetos novos que possuem as funcoes... */

    //Problema a ser retornado
    let p_out : Problema = new Problema();

    //@@ PARAMETROS GERAIS: Seja salvando ou abrindo, copiar uns parametros gerais:
    p_out.titulo = p_in.titulo;
    //Vou salvar pan e zoom, mas não vou salvar o status do googleMaps... Seria muito trabalhoso abrir automaticamente o googlemaps...
    //É muito melhor salvar so o modelo, na ultima posição vista e zoom aplicado, e depois o usuário que click em gMaps e carregue...
    p_out.x_m_centro = p_in.x_m_centro;
    p_out.y_m_centro = p_in.y_m_centro;
    //console.log(p_in.zoom_fator);
    p_out.zoom_fator = p_in.zoom_fator;

    //Salvando, so pega as propriedades, abrindo, redefinindo a Distancia...
    if(s_a) p_out.zoom = Object.assign({},p_in.zoom);
    else p_out.zoom = Object.assign(new Distancia(),p_in.zoom);


    //@@ TEXTOS: Quando estiver salvando, nao copiar funcoes, quando estiver abrindo, fazer o contrario, copiar propriedades pra um objto com funcoes
    if(s_a) {
      if(p_in.svg_texts != null ) {
        for(let text of p_in.svg_texts) {
          let new_text:any = {};
          //Copiando so o necessario
          new_text['text'] = text.text;
          new_text['x_m'] = text.x_m;
          new_text['y_m'] = text.y_m;
          new_text['x_s'] = text.x_s;
          new_text['y_s'] = text.y_s;
          p_out.svg_texts.push(new_text);
        }
      }
    } else {
      if(p_in.svg_texts != null ) {
        for(let text of p_in.svg_texts) {
          p_out.svg_texts.push(Object.assign(new Text(),text));
        }
      }
    }


    //@@ NODES:
    if(s_a) {
      //SALVANDO: É necessario colocar IDs nos nodes, pois serão necessarios para linkar os edges...
      //Eu poderia salvar os nodes avulsos e dentro dos edges como diferentes, mas é melhor usar IDs, pois no futuro pode-se associar outras coisas a nodes...
      if(p_in.g != null && p_in.g.nodes != null ) {
        let node_id = 0;
        for(let node of p_in.g.nodes) {
          let new_node : any = {};
          //Copiando so o necessario
          new_node['x_m'] = node.x_m;
          new_node['y_m'] = node.y_m;
          new_node['x_s'] = node.x_s;
          new_node['y_s'] = node.y_s;
          new_node['cog_rate'] = node.cog_rate;
          new_node['cog_vol'] = node.cog_vol;
          //Definindo um ID
          new_node['ID'] = node_id;
          //Colocando tambem no node original, pois sera necessario logo a frente...
          node['ID'] = node_id;
          p_out.g.nodes.push(new_node);
          node_id++;
        }
      }
    } else {
      //ABRINDO: Recriar os nodes não precisa marcar com ID, mas precisa criar varias novas
      //Simplesmente trazer o objeto do FireBase não traz as funções, etc...
      if(p_in.g != null && p_in.g.nodes != null ) {
        for(let node of p_in.g.nodes) {
          p_out.g.nodes.push(Object.assign(new Node(),node)); //Copiando propriedades de node para um objeto com as funcoes
        }
      }
    }

    //@@ EDGES:
    if(s_a) {
      //SALVANDO: É necessario colocar IDs dos nodes associados, e não salvar as informações nA e nB que ja foram salvas acima...
      if(p_in.g != null && p_in.g.edges != null ) {
        for(let edge of p_in.g.edges) {
          let new_edge : any = {};
          //Copiando so o necessario
          //Alocando IDs dos nodes associados...
          new_edge['na_ID'] = edge.nA['ID'];
          new_edge['nb_ID'] = edge.nB['ID'];
          p_out.g.edges.push(new_edge);
        }
      }
    } else {
      //ABRINDO: Através dos IDs, é preciso reconecar os edges com os nodes...
      if(p_in.g != null && p_in.g.edges != null ) {
        for(let edge of p_in.g.edges) {
          let new_edge = Object.assign(new Edge(),edge);
          //Varrendo nodes para conectar o edge, pois todo edge tem 2 nodes
          for(let node of p_out.g.nodes) {
            if(node['ID'] == new_edge['na_ID']) { new_edge._nA(node);}
            if(node['ID'] == new_edge['nb_ID']) { new_edge._nB(node);}
            if(new_edge.nA != null && new_edge.nB != null) break; //Ja pode terminar a busca pra esse edge...
          }
          p_out.g.edges.push(new_edge);
        }
      }
    }

    return p_out;
  }

}
