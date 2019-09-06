import { Component, ElementRef, ViewChild } from '@angular/core';
import { CircuitService } from '../services/circuit.service';
import { Platform } from '@ionic/angular';

declare let window: any;
@Component({
  selector: 'video-call',
  templateUrl: './video-call.component.html'
})
export class VideoCallComponent {
  constructor(public circuit: CircuitService, private platform: Platform, private elementRef: ElementRef) {}

  get callState(): string {
    return this.circuit.call && this.circuit.call.state;
  }

  get localVideoStream(): Object {
    if (!this.circuit.call || !this.circuit.call.localVideoStream) {
      return null;
    }
    if (this.platform.is('ios')) {
      const localVideo = document.getElementById('localVideo');
      window.cordova.plugins.iosrtc.observeVideo(localVideo);
    }
    return this.circuit.call.localVideoStream;
  }

  get remoteAudioStream(): Object {
    return this.circuit.call && this.circuit.call.remoteAudioStream || null;
  }

  get remoteVideoStream(): Object {
    if (!this.circuit.call || !this.circuit.call.participants.length || !this.circuit.call.participants[0].videoStream) {
      return null;
    }
    if (this.platform.is('ios')) {
      const remoteVideo = document.getElementById('remoteVideo');
      window.cordova.plugins.iosrtc.observeVideo(remoteVideo);
    }
    return this.circuit.call.participants[0].videoStream;
  }
}
