import { Injectable } from '@angular/core';
import { BrowserTab } from '@ionic-native/browser-tab/ngx';
import Circuit from 'circuit-sdk';
import { Platform, LoadingController } from '@ionic/angular';

declare var window: any;

@Injectable({
  providedIn: 'root'
})
export class CircuitService {

  public addEventListener: Function;
  private CIRCUIT_CLIENT_ID: string = '03c2d55587d24a9193d169d9fe7800f4';

  oauthConfig = {
    domain: 'circuitsandbox.net',
    client_id: this.CIRCUIT_CLIENT_ID,
    scheme: 'com.example.circuitsdk',
    redirect_uri: 'com.example.circuitsdk://callback',
    scope: 'READ_USER,READ_USER_PROFILE,CALLS,READ_CONVERSATIONS,WRITE_CONVERSATIONS'
  };

  private authUrl = `https://${this.oauthConfig.domain}/oauth/authorize?`
    + `client_id=${this.oauthConfig.client_id}`
    + `&redirect_uri=${this.oauthConfig.redirect_uri}`
    + `&response_type=token&scope=${this.oauthConfig.scope}`;

  private client: Circuit.Client;
  private authPromiseResolve: any;
  private authPromiseReject: any;

  call: Circuit.Call = null;
  public videoDevices: any; // Video input devices available
  currentDeviceId: any; // Current used video input device

  constructor(private browserTab: BrowserTab, private platform: Platform, private loadingCtrl: LoadingController) {

    window.handleOpenURL = (url: string) => this.handleCustomUrl(url);

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

  private handleCustomUrl(url: string) {
    console.log(`handleCustomUrl called with: ${url}`);

    this.browserTab.close();

    const params: any = this.getParamsFromUrl(url);
    if (params.access_token) {
      console.log('authenticated');
      window.localStorage.setItem('oauth', params.access_token);
      this.authPromiseResolve && this.authPromiseResolve(params.access_token);
    } else {
      console.log('Did not received token upon authentication');
    }
    this.authPromiseReject && this.authPromiseReject(params.error || 'Authentication error');
  }

  private getParamsFromUrl(url: string) {
    var result = {};

    var fragment: string;
    if (url.indexOf('#') > -1) {
      fragment = url.substring(url.indexOf('#') + 1);
    } else if (url.indexOf('?') > -1) {
      fragment = url.substring(url.indexOf('?') + 1);
    } else {
      return result;
    }

    fragment.split('&').forEach(part => {
      var item = part.split('=');
      result[item[0]] = decodeURIComponent(item[1]);
    });

    return result;
  }

  private selectBackCamera() {
    navigator.mediaDevices.enumerateDevices()
      .then(deviceInfos => {
        var videoDevices: MediaDeviceInfo[] = deviceInfos.filter(deviceInfo => deviceInfo.kind === 'videoinput');
        console.log(`Found ${videoDevices.length} video devices`);

        const videoDevice: MediaDeviceInfo = videoDevices[0]; // on iPhone 8 plus this is the back camera
        console.log(`Setting videoDevice: ${videoDevice.label} (${videoDevice.deviceId})`)

        this.client.setMediaDevices({ video: videoDevice.deviceId })
          .then(() => console.log(`Set new videoDevice: ${videoDevice.label} (${videoDevice.deviceId})`))
          .catch(err => console.log('Could not set new videoDevice: ' + err));
      })
      .catch(err => console.log('enumerateDevices failed' + err));
  }

  private async getVideoDevices() {
    const deviceInfos = await navigator.mediaDevices.enumerateDevices();
    this.videoDevices = deviceInfos.filter(si => si.kind === 'videoinput');
    this.videoDevices = this.videoDevices.reverse();
    console.log('Video devices are:', this.videoDevices.map(vd => vd.deviceId + '-' + vd.label).join(', '));
  }

  // Logon to Circuit using the access token and show spinner while looging in.
  private async logonWithToken(token: string): Promise<Circuit.User> {
    const loading = await this.loadingCtrl.create({ message: 'Signing in...' });
    try {
      await loading.present();
      const user = await this.client.logon({ accessToken: token, skipTokenValidation: true });
      await loading.dismiss();
      return user;
    } catch (err) {
      await loading.dismiss();
      throw err;
    }
  }

  private authenticateMobile(): Promise<string> {
    const accessToken: string = window.localStorage.getItem('oauth');
    if (accessToken) {
      return Promise.resolve(accessToken);
    }
    return new Promise((resolve, reject) => {
      this.authPromiseResolve = resolve;
      this.authPromiseReject = reject;

      var authUrlWithState = this.authUrl + '&state=todo';

      this.browserTab.openUrl(authUrlWithState)
        .then(() => console.log('Authenticating...'), reject);
    });
  }

  private async authenticateWeb(): Promise<string> {
    try {
      // Check if token and session is valid, so that logon function will not popup OAuth window
      await this.client.logonCheck();
      return this.client.accessToken;
    } catch (err) {
      // No valid token or session, show sign in button
      return null;
    }
  }

  /**
   * Initialize Circuit after cordova-plugin-iosrtc plugin is loaded.
   */
  initWebRTC() {
    if (this.platform.is('ios')) {
      // Enable logging for cordova-plugin-iosrtc
      //window.cordova.plugins.iosrtc.debug.enable('iosrtc*');

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
  async logon() {
    try {
      let token = null;
      if (this.platform.is('mobile')) {
        token = await this.authenticateMobile();
      } else {
        token = await this.authenticateWeb();
      }
      const user = await this.logonWithToken(token);

      await this.getVideoDevices();
      this.selectBackCamera();
      return user;
    } catch (err) {
      window.localStorage.removeItem('oauth');
      throw err;
    }
  }

  /**
   * Logout of Circuit
   */
  async logout(clearToken: boolean) {
    await this.client.logout();
    clearToken && window.localStorage.removeItem('oauth');
  }

  /**
   * Starts video/audio call with the specified user, conversation will be created
   * if it does not exist.
   */
  async startCall(email: string, video: boolean): Promise<Circuit.Call> {
    this.call = await this.client.makeCall(email, { audio: true, video: !!video }, true);
    return this.call;
  }

  /**
   * Answer an incoming call
   */
  async answerCall(video) {
    if (!this.call) {
      throw Error('No incoming call found');
    }
    await this.client.answerCall(this.call.callId, {
      audio: true,
      video: !!video
    });
  }

  /**
   * Toggle own video
   */
  async toggleVideo() {
    if (!this.call) {
      console.error('Cannot toogle video. No call found.');
      return;
    }
    await this.client.toggleVideo(this.call.callId);
  }

  /**
   * Swtich between front and rear camera. Android requires the old track
   * to be stopped, and its stream to be removed before the new stream can
   * be added, otherwise getUserMedia will fail.
   * This has to be done here since the Circuit SDK internally assumes
   * getUserMedia can be called while a stream is already being captured
   * to allow for instant switching. So for Ionic the switching is
   * unfortunately not instance.
   */
  async switchCamera() {
    const stream = await this.client.getLocalAudioVideoStream();
    let videoTrack = stream.getVideoTracks()[0];
    console.log(`Current video track is using ${videoTrack.label}`);
    if (this.videoDevices.length < 2) {
      throw Error('Two cameras required to switch');
    }
    stream.removeTrack(videoTrack);
    videoTrack.stop();
    const newDevice = this.videoDevices.find(d => d.deviceId !== this.currentDeviceId);
    await this.client.setMediaDevices({ video: newDevice.deviceId });
    this.currentDeviceId = newDevice.deviceId;
  }

  /**
   * End the active call
   */
  async endCall() {
    if (!this.call) {
      return;
    }
    try {
      await this.client.endCall(this.call.callId);
    } catch (err) {
      console.error('Trying to end a call that has already ended.');
      this.call = null;
    }
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
