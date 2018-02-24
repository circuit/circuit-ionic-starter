import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import Circuit from 'circuit-sdk';

declare var window: any;

@Injectable()
export class CircuitService {
  client: any; // Circuit SDK instance
  user: any; // Logged on user
  call: any; // Active call object
  videoDevices: any; // Video input devices available
  currentDeviceId: any; // Current used video input device

  connectionState: string = Circuit.Enums.ConnectionState.Disconnected;
  authPromiseResolve: any;
  authPromiseReject: any;

  public addEventListener: Function;

  // OAuth configuration. Get your own client_id for your app at https://circuit.github.io/oauth.html
  oauthConfig = {
    domain: 'circuitsandbox.net',
    client_id: 'c55d010a9ac84aa9a7ee2e137a584706',
    scheme: 'com.unify.ionicstarter',
    redirect_uri: 'com.unify.ionicstarter://callback',
    scope: 'ALL'
  };

  constructor(
    public platform: Platform,
    public loadingCtrl: LoadingController
  ) {
    // Handle custom url triggered by Custom-URL-scheme plugin
    (window as any).handleOpenURL = (url: string) => this.handleCustomUrl(url);

    // Set Circuit SDK internal log level
    Circuit.logger.setLevel(Circuit.Enums.LogLevel.Debug);

    // Create the Circuit SDK client using Implicit grant type
    // See http://circuit.github.com/oauth
    this.client = new Circuit.Client({
      client_id: this.oauthConfig.client_id,
      domain: this.oauthConfig.domain,
      scope: this.oauthConfig.scope
    });

    // Bind event listener directly to SDK's addEventListener
    this.addEventListener = this.client.addEventListener.bind(this);

    // Keep the call object current in this service
    this.client.addEventListener('callIncoming', evt => this.call = evt.call);
    this.client.addEventListener('callStatus', evt => this.call = evt.call);
    this.client.addEventListener('callEnded', evt => this.call = null);
  }

  // Handle redirect from OAuth via Custom-URL-scheme plugin
  private handleCustomUrl(url: string) {
    console.log(`handleCustomUrl called with: ${url}`);
    window.cordova.plugins.browsertab.close();
    const json: any  = this.getJsonFromUrl(url.substring(url.indexOf('#') + 1));
    if (json.access_token) {
      window.localStorage.setItem('access_token', json.access_token);
      this.authPromiseResolve && this.authPromiseResolve(json.access_token);
    } else if (json.errorDescription || json.error) {
      this.authPromiseReject && this.authPromiseReject(json.errorDescription || json.error);
    } else {
      this.authPromiseReject && this.authPromiseReject('unknown error');
    }
  }

  // Get JSON from url parameters
  private getJsonFromUrl(url: string) {
    var result = {};
    url.split('&').forEach(part => {
      var item = part.split('=');
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }

  // Authenticate the user. If token is present in localStore return that immediately,
  // otherwise start OAuth flow by opening /oauth/authorize.
  private authenticate() {
    const access_token: string = window.localStorage.getItem('access_token');
    if (access_token) {
      return Promise.resolve(access_token);
    }

    return new Promise((resolve, reject) => {
      this.authPromiseResolve = resolve;
      this.authPromiseReject = reject;

      var url =
        `https://${this.oauthConfig.domain}/oauth/authorize?` +
        `client_id=${this.oauthConfig.client_id}` +
        `&redirect_uri=${this.oauthConfig.redirect_uri}` +
        `&state=todorandomvalue` +
        `&response_type=token&scope=${this.oauthConfig.scope}`;

      window.cordova.plugins.browsertab.openUrl(url, () => {
        console.log(`Successfully opened ${url}`);
      }, reject);
    });
  }

  // Logon to Circuit using the access token and show spinner while looging in.
  private logonWithSpinner(token) {
    const loading = this.loadingCtrl.create({ content: 'Signing in...' });
    loading.present();
    return this.client.logon({ accessToken: token, skipTokenValidation: true })
      .then(user => {
        loading.dismiss();
        return user;
      })
      .catch(err => {
        window.localStorage.removeItem('access_token');
        loading.dismiss();
        return Promise.reject(err);
      });
  }

  private getVideoDevices() {
    return navigator.mediaDevices.enumerateDevices()
       .then(deviceInfos => {
          this.videoDevices = deviceInfos.filter(si => si.kind === 'videoinput');
          this.videoDevices = this.videoDevices.reverse();
          console.log('Video devices are:', this.videoDevices.map(vd => vd.deviceId + '-' + vd.label).join(', '));
      });
  }
  /**
   * Initialize Circuit after cordova-plugin-iosrtc plugin is loaded.
   */
  initWebRTC() {
    if (window.device.platform === 'iOS') {
      // Enable logging for cordova-plugin-iosrtc
      window.cordova.plugins.iosrtc.debug.enable('iosrtc*');

      // Register iosrtc apis as globals. This is not required to use
      // the Circuit RTC APIs, but done so that navigator.mediaDevices
      // is availble to get the video devices for switching cameras.
      window.cordova.plugins.iosrtc.registerGlobals();

      // Cordova iOS requires Circuit to initialize the WebRTCAdapter AFTER
      // the cordova-plugin-iosrtc plugin is loaded.
      Circuit.WebRTCAdapter.init();
    }
  }

  /**
   * Logon to Circuit. If no token available in localStorage, present OAuth window
   * using Chrome Custom Tab (Android) and SFSafariViewController (iOS) with plugin
   * cordova-plugin-browsertab. Use plugin cordova-plugin-customurlscheme to redirect
   * back to app after accepting OAuth permissions.
   */
  logon() {
    return this.authenticate()
      .then(this.logonWithSpinner.bind(this))
      .then(this.getVideoDevices.bind(this))
      .catch(err => {
        // Update error message shown to user regarding issue https://issues.apache.org/jira/browse/CB-12074
        if (err && err.message && err.message.indexOf('Failed to open WebSocket') !== -1) {
          err.message = 'Due to a bug in Cordova, cookies are not working the first time the app runs after install. Close the app and try again. Bug: https://issues.apache.org/jira/browse/CB-12074.';
        }
        return Promise.reject(err);
      });
  }

  /**
   * Logout of Circuit
   */
  logout() {
    return this.client.logout();
  }

  /**
   * Starts video/audio call with the specified user, conversation will be created
   * if it does not exist.
   */
  startCall(email: string, video: boolean): Promise<any> {
    return this.client.makeCall(email, { audio: true, video: !!video }, true)
      .then(call => this.call = call)
      .catch(console.error);
  }

  /**
   * Answer an incoming call
   */
  answerCall(video) {
    if (!this.call) {
      return Promise.reject('No incoming call found');
    }
    const mediaType = {
      audio: true,
      video: !!video
    }
    return this.client.answerCall(this.call.callId, mediaType);
  }

  /**
   * Toggle own video
   */
  toggleVideo() {
    if (!this.call) {
      return Promise.reject('No call found');
    }
    return this.client.toggleVideo(this.call.callId);
  }

  /**
   * Swtich between front and rear camera. Android requires the old track
   * to be stopped, adn its stream to be removed before the new stream can
   * be added, otherwise getUserMedia will fail.
   * This has to be done here since the Circuit SDK internally assumes
   * getUserMedia can be called while a stream is already being captured
   * to allow for instant switching. So for Ionic the switching is
   * unfortunately not instance.
   */
  switchCamera() {
    return this.client.getLocalAudioVideoStream()
      .then(stream => {
        let videoTrack = stream.getVideoTracks()[0];
        console.log(`Current video track is using ${videoTrack.label}`);
        if (this.videoDevices.length < 2) {
          Promise.reject('Two cameras required to switch');
          return;
        }
        stream.removeTrack(videoTrack);
        videoTrack.stop();
        return this.videoDevices.find(d => d.deviceId !== this.currentDeviceId)
      })
      .then(newDevice => {
        return this.client.setMediaDevices({video: newDevice.deviceId})
          .then(() => this.currentDeviceId = newDevice.deviceId)
      });
  }

  /**
   * End the active call
   */
  endCall() {
    if (!this.call) {
      return Promise.resolve();
    }
    return this.client.endCall(this.call.callId);
  }

  /**
   * Get logged on user. client.loggedOnUser is not yet set when connectionState
   * changes to 'Connected', but only after client.logon is resolved. Using this
   * function ensures the user is returned as it depends on the websocket to be up.
   */
  getLoggedOnUser() {
    return this.client.getLoggedOnUser();
  }
}
