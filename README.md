# circuit-ionic-starter

Ionic 5 example application demonstrating how to use the Circuit SDK, specifically the challenging parts of authentication via OAuth 2.0 and WebRTC video calling.

Tested on Android and iOS.
<p float="left">
  <kbd><img src="https://dl.dropboxusercontent.com/s/w1q88i4gdrx7238/ios1.png?dl=0" width="200"></kbd>
  <kbd><img src="https://dl.dropboxusercontent.com/s/0odzzgc5zo7ja56/ios2.png?dl=0" width="200"></kbd>
</p>



> App requires Circuit SDK version 1.2.7100 or higher which is available in circuit-sdk@beta. This version is compatible with the iosrtc plugin 5.0.2 or higher.

> iOS Authentication and iOS/Android video calling requires running on the device. The simulator will not work.

## Authentication
Authentication is done OAuth 2.0 Implicit Grant. This means the user is redirected to a Circuit hosted OAuth login page for authentication. This application will then get a token to act on the user's behalf. This is the recommended authentication method for Ionic application, same as for regular client-side web applications. For more information on OAuth types in Circuit refer to [http://circuit.github.io/oauth]().

Two options exists for opening the Circuit OAuth page.
1. Using the [cordova-plugin-inappbrowser](https://github.com/apache/cordova-plugin-inappbrowser) plugin to open a new browser instance for the OAuth url.
2. Using Chrome Custom Tab (Android) and SFSafariViewController (iOS) with plugin [cordova-plugin-browsertab](https://github.com/google/cordova-plugin-browsertab).

We are using option 2 in this application which is the recommended option. Details can be found at [Stop using InAppBrowser for your Cordova/Phonegap oAuth flow](https://medium.com/@jlchereau/stop-using-inappbrowser-for-your-cordova-phonegap-oauth-flow-a806b61a2dc5) and [Modernizing OAuth interactions in Native Apps for Better Usability and Security](https://developers.googleblog.com/2016/08/modernizing-oauth-interactions-in-native-apps.html).

For the redirection of the OAuth page back to the application we are using the plugin [Custom-URL-scheme](https://github.com/EddyVerbruggen/Custom-URL-scheme) with the uri scheme `com.unify.ionicstarter`.


## WebRTC calling

See https://circuit.github.io/jssdk for Circuit JS SDK examples, including WebRTC direct and group calling.

### Android
Android uses Chrome webviews which natively supports WebRTC. No plugin is required.

### iOS
For iOS [cordova-plugin-iosrtc
](https://github.com/cordova-rtc/cordova-plugin-iosrtc) is used which exposes the standard WebRTC APIs. To tell Circuit to use these APIs exposed by the plugin, call `Circuit.WebRTCAdapter.init()` after the plugin is loaded:

```javascript
this.platform.ready().then(() => {
    if (this.platform.is('ios')) {
        Circuit.WebRTCAdapter.init();
    }
}
```

> The cordova-plugin-iosrtc development is currently very active. This app uses version 5.0.5, but 6.0.0 is in beta already.


## Useful links for Circuit SDK
* [Circuit SDK on github](https://github.com/circuit/circuit-sdk)
* [Circuit API documentation](https://circuitsandbox.net/sdk/) - See `client` class
* [Circuit JS SDK examples](https://circuit.github.io/jssdk)


## Usage

### Prerequisites
* Android Environment (or iOS if you’re working on a MacOS)
* Cordova and Ionic installed. See https://ionicframework.com/docs/installation/cli  for details.

### Get code
```bash
  git clone https://github.com/circuit/circuit-ionic-starter.git
  cd circuit-ionic-starter
  npm install
```

### Build and run on Android
```bash
  // Connect your device
  ionic cordova run android
```

### Build and run on iOS
```bash
  // Connect your device
  ionic cordova run ios
  // or "ionic cordova build ios" and then use xcode to run the app on the device
```

### Run on desktop
For WebRTC to get the media stream the app needs to be hosted on https.
```bash
  ionic ssl generate  // Only the first time to create the self signed certificate
  ionic serve --ssl -- --ssl-cert ./.ionic/ssl/cert.pem --ssl-key ./.ionic/ssl/key.pem --port 8443
```

### Debugging
I use Visual Code with the "Cordova Tools" extension for debugging. But you can also use the Chrome Dev Tools for Android and Safari Web Inspector for iOS.

## Known issues
* None
