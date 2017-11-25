import {Injectable} from "@angular/core";
import {Platform} from "ionic-angular";
import { LoadingController } from 'ionic-angular';

declare var Circuit: any;
declare var window: any;

@Injectable()
export class CircuitService {
  client: any;
  user: any;
  call: any;
  connectionState: string = Circuit.Enums.ConnectionState.Disconnected;

  authPromiseResolve: any;
  authPromiseReject: any;

  public addEventListener: Function;

  oauthConfig = {
    domain: 'circuitsandbox.net',
    client_id: 'c55d010a9ac84aa9a7ee2e137a584706',
    redirect_uri: 'circuit-ionic://callback',
    scope: 'ALL'
  };

  constructor(
    public platform: Platform,
    public loadingCtrl: LoadingController
  ) {
    // Handle custom url triggered by Custom-URL-scheme plugin
    (window as any).handleOpenURL = (url: string) => this.handleCustomUrl(url);

    // Circuit.logger.setLevel(Circuit.Enums.LogLevel.Debug);

    // Create the Circuit SDK client using implicit grant type since
    // the secret cannot be kept secret in a web app
    this.client = new Circuit.Client({
      client_id: this.oauthConfig.client_id,
      domain: this.oauthConfig.domain,
      scope: this.oauthConfig.scope
    });

    // Bind event listener directly to SDK's addEventListener
    this.addEventListener = this.client.addEventListener.bind(this);

    // Keep the call object current in this service
    this.client.addEventListener('callStatus', evt => this.call = evt.call);
    this.client.addEventListener('callEnded', evt => this.call = null);
  }

  private handleCustomUrl(url: string) {
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

  private getJsonFromUrl(url: string) {
    var result = {};
    url.split('&').forEach(part => {
      var item = part.split('=');
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }

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

      window.cordova.plugins.browsertab.openUrl(url);
    });
  }


  /**
   * Logon to Circuit. Presents OAuth window using Chrome Custom Tab (Android)
   * and SFSafariViewController (iOS) if no token available in localStorage.
   */
  logon() {
    const loading = this.loadingCtrl.create({ content: 'Signing in...' });
    loading.present();
    return this.authenticate()
      .then(token => this.client.logon({ accessToken: token, skipTokenValidation: true }))
      .then(user => {
        loading.dismiss();
        return user;
      })
      .catch(err => {
        loading.dismiss();
        return Promise.reject(err);
      })
  }

  /**
   * Logout of Circuit
   */
  logout() {
    return this.client.logout();
  }

  /**
   * Starts video/audio call with the specified user,
   * conversation will be created if it does not exist
   */
  startCall(email: string, video: boolean): Promise<any> {
    return this.client.makeCall(email, { audio: true, video: !!video }, true)
      .then(call => this.call = call)
      .catch(console.error);
  }

  /**
   * End the active call
   */
  endCall() {
    return this.client.endCall(this.call.callId);
  }

  getLoggedOnUser() {
    return this.client.getLoggedOnUser();
  }

}
