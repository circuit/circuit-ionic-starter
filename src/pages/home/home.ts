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
        // App component tries to logon as soon as app starts. If successful this
        // `connectionStateChanged` event is raised. At this time get the user
        // object and request the camera and mic permission
        circuit.getLoggedOnUser()
          .then(user => this.user = user)
          .then(() => this.requestPermissions())
          .catch(window.alert)
      }
    });
  }

  // Request permissions for using camera and mic on android device
  private requestPermissions() {
    if (window.device.platform === 'Android') {
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
  }

  // Getter for active call managed by Circuit service
  get call() {
    return this.circuit.call;
  }

  // Getter for established call
  get isEstablished() {
    return this.circuit.call && this.circuit.call.isEstablished;
  }

  // Getter for incoming (ringing) call
  get isRinging() {
    return this.circuit.call && this.circuit.call.state === Circuit.Enums.CallStateName.Ringing;
  }

  // User action to sign in
  signin() {
    this.circuit.logon()
      .then(user => this.user = user)
      .catch(err => (window as any).alert('Logon error: ' + err));
  }

  // User action to sign out
  signout() {
    (window as any).localStorage.removeItem('access_token');
    this.user = null;
    this.circuit.logout()
      .catch(console.error);
  }

  // User action to start a direct call
  startCall(email, video) {
    this.circuit.startCall(email, video)
      .catch(console.error);
  }

  // User action to answer call
  answerCall(video) {
    this.circuit.answerCall(video)
      .catch(console.error);
  }

  // User action to switch front and back camera
  switchCamera() {
    this.circuit.switchCamera()
      .catch(console.error);
  }

  // User action to toggle own video
  toggleVideo() {
    this.circuit.toggleVideo()
      .catch(console.error);
  }

  // User action to end call
  endCall() {
    this.circuit.endCall()
      .catch(console.error);
  }
}
