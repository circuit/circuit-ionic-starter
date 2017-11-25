import { Component, ElementRef } from '@angular/core';
import { CircuitService } from '../../providers/circuit.service';

@Component({
  selector: 'video-call',
  templateUrl: './video-call.component.html'
})
export class VideoCallComponent {
  constructor(public circuit: CircuitService, public element: ElementRef) {
  }

  get callState(): string {
    return this.circuit.call && this.circuit.call.state;
  }

  get localVideoUrl(): string {
    return this.circuit.call && this.circuit.call.localVideoUrl;
  }

  get remoteAudioUrl(): string {
    return this.circuit.call && this.circuit.call.remoteAudioUrl;
  }

  get remoteVideoUrl(): string {
    return this.circuit.call && this.circuit.call.participants.length && this.circuit.call.participants[0].videoUrl;
  }
}
