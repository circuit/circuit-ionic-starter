import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import Circuit from 'circuit-sdk';
import { CircuitService } from '../services/circuit.service';

declare var window: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.page.html'
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

  private async requestPermissions() {
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
  async signin() {
    try {
      const user: any = await this.circuit.logon();
      this.user = user;
    } catch (err) {
      alert('Logon error: ' + err.message);
    }
  }

  // User action to sign out
  async signout() {
    (window as any).localStorage.removeItem('access_token');
    this.user = null;
    try {
      await this.circuit.logout()
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
  }

  // User action to start a direct call
  async startCall(email, video) {
    try {
      await this.circuit.startCall(email, video);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // User action to answer call
  async answerCall(video) {
    try {
      await this.circuit.answerCall(video);
    } catch (err) {
      console.error(err); 
      alert(err.message);
    }
  }

  // User action to switch front and back camera
  async switchCamera() {
    try {
      await this.circuit.switchCamera();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // User action to toggle own video
  async toggleVideo() {
    try {
      await this.circuit.toggleVideo();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // User action to end call
  async endCall() {
    try {
      await this.circuit.endCall();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }
}
