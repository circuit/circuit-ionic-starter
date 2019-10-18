import { Component, ElementRef, ViewChild } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CircuitService } from '../services/circuit.service';
import Circuit from 'circuit-sdk';

declare let window: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild('videoContainer', { static: false }) videoContainer: ElementRef;

  user: any;
  call: Circuit.Call;
  connectionState: string = Circuit.Enums.ConnectionState.Disconnected;
  localVideoStream: MediaStream = null;
  remoteVideoStream: MediaStream = null;
  localVideoEl: any;
  remoteVideoEl: any
  
  constructor(private circuit: CircuitService, private platform: Platform) {
    this.circuit.addEventListener('connectionStateChanged', async evt => {
      this.connectionState = evt.state;
      if (evt.state === Circuit.Enums.ConnectionState.Connected) {
        // App component tries to logon as soon as app starts. If successful this
        // `connectionStateChanged` event is raised. At this time get the user
        // object and request the camera and mic permission
        this.user = await circuit.getLoggedOnUser();
        this.requestPermissions();
      }
    });

    this.circuit.addEventListener('callStatus', evt => {
      this.call = evt.call;
      this.updateVideos();
    });

    this.circuit.addEventListener('callIncoming', evt => {
      this.call = evt.call;
    });

    this.circuit.addEventListener('callEnded', evt => {
      this.call = evt.call;
      this.updateVideos();
      this.call = null; 
    });
  }

  private createVideoElement() {
    const el = document.createElement('video');
    el.setAttribute('autoplay', 'autoplay');
    el.setAttribute('playsinline', 'playsinline');
    this.videoContainer.nativeElement.appendChild(el);
    return el;
  }

  // Create video elements if needed, or update its srcObject.
  // Done this way to please the iosrtc plugin
  private updateVideos() {
    const newLocalVideoStream = this.call.localVideoStream;
    if (this.localVideoStream !== newLocalVideoStream) {
      !this.localVideoEl && (this.localVideoEl = this.createVideoElement());
      this.localVideoEl.srcObject = newLocalVideoStream;
      this.platform.is('ios') && window.cordova.plugins.iosrtc.observeVideo(this.localVideoEl);
      if (!newLocalVideoStream) {
        this.videoContainer.nativeElement.removeChild(this.localVideoEl);
        this.localVideoEl = null;
      }
      this.localVideoStream = newLocalVideoStream;
    }

    let newRemoteVideoStream = (this.call.participants.length && this.call.participants[0].videoStream) || null;
    if (this.call.state === 'Terminated') {
      // Participants videoStream is not set to null yet at tihs point. To be looked at why that is. 
      newRemoteVideoStream = null;
    }
    if (this.remoteVideoStream !== newRemoteVideoStream) {
      !this.remoteVideoEl && (this.remoteVideoEl = this.createVideoElement());
      this.remoteVideoEl.srcObject = newRemoteVideoStream;
      this.platform.is('ios') && window.cordova.plugins.iosrtc.observeVideo(this.remoteVideoEl);
      if (!newRemoteVideoStream) {
        this.videoContainer.nativeElement.removeChild(this.remoteVideoEl);
        this.remoteVideoEl = null;
      }
      this.remoteVideoStream = newRemoteVideoStream;
    }

    this.platform.is('ios') && window.cordova.plugins.iosrtc.refreshVideos();
  }


  // Request permissions for using camera and mic on android device
  private requestPermissions() {
    if (this.platform.is('android')) {
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

  // Getter for established call
  get isEstablished() {
    return this.circuit.call && this.circuit.call.isEstablished;
  }

  // Getter for incoming (ringing) call
  get isRinging() {
    return this.circuit.call && this.circuit.call.state === Circuit.Enums.CallStateName.Ringing;
  }

  // Getter for available video devices
  get videoDevices() {
    return this.circuit.videoDevices;
  }

  // User action to sign in
  async signin() {
    this.user = await this.circuit.logon();
  }

  // User action to sign out
  async signout() {
    this.user = null;
    await this.circuit.logout(true);
  }

  // User action to start a direct call
  async startCall(email, video) {
    this.call = await this.circuit.startCall(email, video);
  }

  // User action to answer call
  async answerCall(video) {
    await this.circuit.answerCall(video);
  }

  // User action to switch front and back camera
  async switchCamera() {
    await this.circuit.switchCamera();

    if (this.platform.is('ios')) {
      // Recreate video elements. Hopehully that will get fixed in iosrtc sometime.
      this.videoContainer.nativeElement.removeChild(this.localVideoEl);
      this.localVideoEl = null;
      this.localVideoStream = null;
      this.videoContainer.nativeElement.removeChild(this.remoteVideoEl);
      this.remoteVideoEl = null;
      this.updateVideos();
    }
  }

  // User action to toggle own video
  async toggleVideo() {
    await this.circuit.toggleVideo();

    if (this.platform.is('ios')) {
      // iosrtc plugin causes remote video to freeze when toggling local video,
      // readd the remote stream video element
      this.videoContainer.nativeElement.removeChild(this.remoteVideoEl);
      this.remoteVideoEl = null;
      this.updateVideos();
    }
  }

  // User action to end call
  async endCall() {
    await this.circuit.endCall();
  }
}
