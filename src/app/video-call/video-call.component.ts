import { Component } from '@angular/core';
import { CircuitService } from '../services/circuit.service';

@Component({
  selector: 'video-call',
  templateUrl: './video-call.component.html'
})
export class VideoCallComponent {
  constructor(public circuit: CircuitService) {
  }

  get callState(): string {
    return this.circuit.call && this.circuit.call.state;
  }

  get localVideoStream(): string {
    return this.circuit.call && this.circuit.call.localVideoStream || null;
  }

  get remoteAudioStream(): Object {
    return this.circuit.call && this.circuit.call.remoteAudioStream || null;
  }

  get remoteVideoStream(): Object {
    return this.circuit.call && this.circuit.call.participants.length && this.circuit.call.participants[0].videoStream || null;
  }
}
