import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { CircuitService } from '../providers/circuit.service';
import { HomePage } from '../pages/home/home';

declare var window: any;

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = HomePage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, circuit: CircuitService) {
    platform.ready()
      .then(() => {
        statusBar.styleDefault();
        splashScreen.hide();
      })
      .then(() => circuit.logon())
      .catch(err => (window as any).alert('Logon error: ' + err));
  }
}

