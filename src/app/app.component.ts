import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { CircuitService } from './services/circuit.service';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

declare var window: any;
declare var wkWebView: any;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private androidPermissions: AndroidPermissions,
    private circuit: CircuitService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      if (this.platform.is('ios')) {
        wkWebView.injectCookie(this.circuit.oauthConfig.domain + '/');
        this.circuit.initWebRTC();
      }

      this.circuit.logon()
        .catch(console.error);
    });
  }
}
