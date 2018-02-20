import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import Circuit from 'circuit-sdk';
import { CircuitService } from '../../providers/circuit.service';

declare var window: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  user: any;
  connectionState: string = Circuit.Enums.ConnectionState.Disconnected;

  constructor(public navCtrl: NavController, public circuit: CircuitService) {
    this.circuit.addEventListener('connectionStateChanged', evt => {
      this.connectionState = evt.state;
      if (evt.state === Circuit.Enums.ConnectionState.Connected) {
        circuit.getLoggedOnUser()
          .then(user => this.user = user)
          .then(() => this.requestPermissions())
          .catch(window.alert)
      }
    });
  }

  get call() {
    return this.circuit.call;
  }

  /**
   * Requesting permissions for using camera on android device
   */
  private requestPermissions() {
    window.cordova.plugins.diagnostic.requestRuntimePermissions((statuses) => {
      for (let permission in statuses) {
        switch (statuses[permission]) {
          case window.cordova.plugins.diagnostic.permissionStatus.GRANTED:
            console.log(`Permission granted to use ${permission}`);
            break;
          case window.cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
            console.warn(`Permission to use ${permission} has not been requested yet`);
            break;
          case window.cordova.plugins.diagnostic.permissionStatus.DENIED:
            console.warn(`Permission denied to use ${permission}`);
            break;
          case window.cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
            console.warn(`Permission permanently denied to use ${permission}`);
            break;
        }
      }
    }, (error) => console.error(`The following error occurred: ${error}`), [
      window.cordova.plugins.diagnostic.permission.CAMERA,
      window.cordova.plugins.diagnostic.permission.RECORD_AUDIO,
      window.cordova.plugins.diagnostic.permission.WRITE_EXTERNAL_STORAGE
    ]);
  }

  signin() {
    this.circuit.logon()
      .then(user => this.user = user)
      .catch(err => (window as any).alert('Logon error: ' + err));
  }

  signout() {
    (window as any).localStorage.removeItem('access_token');
    this.user = null;
    this.circuit.logout()
      .catch(console.error);
  }

  isOngoingCall() {
    return false;
  }

  startCall(email, video) {
    this.circuit.startCall(email, video)
      .catch(console.error);
  }

  switchCamera() {
    // todo
  }

  endCall() {
    this.circuit.endCall()
      .catch(console.error);
  }
}
