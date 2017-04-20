import {ChangeDetectorRef, Component, OnInit} from '@angular/core';

declare var $: any;
declare var firebase: any;
declare var firebaseui: any;

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

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

  constructor(private _CD : ChangeDetectorRef) {

    this.status_logado = true;

  }

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

    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);

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
        this._CD.detectChanges();

        //Pegando o token de acesso
        user.getToken().then( (accessToken) => {
          this.accessToken = accessToken;
        });
      } else {
        this.status_logado = false;
        //COMO [HIDDEN] TAVA MEIO BUGADO, DISPARO MANUALMENTE CHANGE DETECTION
        //Nao posso usar ngIf, pois preciso da referencia do div pra usar aqui com ui.start
        this._CD.detectChanges();
      }
    }, (error) => {
      console.log(error);
    });

  }

  logoff() {
    firebase.auth().signOut();
  }

  show_modal() {
    $('#modal-auth').modal('show');
  }

}
