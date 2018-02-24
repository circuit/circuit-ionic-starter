# circuit-ionic-starter

Ionic 2 starter application demonstrating how to use the Circuit SDK, specifically the challanging parts of authentication via OAuth 2.0 and WebRTC video calling.

Tested on Android and iOS.
<p float="left">
  <kbd><img src="https://dl.dropboxusercontent.com/s/wq7iowble8zwlvh/ionic-starter-login.png?dl=0" width="200"></kdb>
  <kbd><img src="https://dl.dropboxusercontent.com/s/w5r6e5jgl6kanl7/ionic-starter-idle.png?dl=0" width="200"></kdb>
  <kbd><img src="https://dl.dropboxusercontent.com/s/1d8cmxltlq458h7/ionic-starter-video.png?dl=0" width="200"></kdb>
</p>



> App requires Circuit SDK version 1.2.2805 or higher which is available in circuit-sdk@beta

> iOS Authentication and iOS/Android video calling requires running on the device

## Authentication
Authentication is done OAuth 2.0 Implicit Grant. This means the user is redirected to a Circuit hosted OAuth login page for authentication. This application will then get a token to act on the user's behalf. This is the recommended authentication method for Ionic application, same as for regular client-side web applications. For more information on OAuth types in Circuit refer to [http://circuit.github.io/oauth]().

Two options exists for opening the Circuit OAuth page.
1. Using the [cordova-plugin-inappbrowser](https://github.com/apache/cordova-plugin-inappbrowser) plugin to open a new browser instance for the OAuth url.
2. Using Chrome Custom Tab (Android) and SFSafariViewController (iOS) with plugin [cordova-plugin-browsertab](https://github.com/google/cordova-plugin-browsertab).

We are using option 2 in this application which is the recommended option. Details can be found at [Stop using InAppBrowser for your Cordova/Phonegap oAuth flow](https://medium.com/@jlchereau/stop-using-inappbrowser-for-your-cordova-phonegap-oauth-flow-a806b61a2dc5) and [Modernizing OAuth interactions in Native Apps for Better Usability and Security](https://developers.googleblog.com/2016/08/modernizing-oauth-interactions-in-native-apps.html).

For the redirection of the OAuth page back to the application we are using the plugin [Custom-URL-scheme](https://github.com/EddyVerbruggen/Custom-URL-scheme) with the uri scheme `com.unify.ionicstarter`.

> On the iOS device there is a bug in Ionic regarding cookies not saved on first run after install. Closing the app and reopening solves the problem. Workarounds until this is fixed are described [here](https://issues.apache.org/jira/browse/CB-12074) and [here](https://github.com/ionic-team/cordova-plugin-ionic-webview/issues/22). To keep this app simple I opted not to add these workarounds and hope Ionic/Cordova address this issue soon. Further more in the iOS simulator the cookies aren't saved at all it seems and the websocket cannot be established. Haven't had time to investigate this yet and since I am using the device, it didn't affect me. Might be related to [this](https://issues.apache.org/jira/browse/CB-10728).


## WebRTC calling

See https://circuit.github.io/jssdk for Circuit JS SDK examples, including WebRTC direct and group calling.

### Android
Android uses Chrome webviews which natively supports WebRTC. No plugin is required.

### iOS
iOS uses Safari webviews which don't support WebRTC. So for iOS [cordova-plugin-iosrtc
](https://github.com/BasqueVoIPMafia/cordova-plugin-iosrtc) is used which exposes the standard WebRTC APIs. To tell Circuit to use these APIs exposed by the plugin, call `Circuit.WebRTCAdapter.init()` after the plugin is loaded:

```javascript
// Required for iOS only
platform.ready()
  .then(() => Circuit.WebRTCAdapter.init())
  .catch(console.error);
```


## Useful links for Circuit SDK
* [Circuit SDK on github](https://github.com/circuit/circuit-sdk)
* [Circuit API documentation](https://circuitsandbox.net/sdk/) - See `client` class
* [Circuit JS SDK examples](https://circuit.github.io/jssdk)


## Usage

### Prerequisites
* Android Environment (or iOS if you’re working on a MacOS)
* Cordova and Ionic installed. See https://ionicframework.com/docs/intro/installation/ for details.

### Build and run
```bash
  git clone https://github.com/circuit/circuit-ionic-starter.git
  cd circuit-ionic-starter
  npm install
  // Connect your device
  ionic run android --device (or ionic run ios --device)
```

### Debugging
I use Visual Code with the "Cordova Tools" extension for debugging. But you can also use the Chrome Dev Tools for Android and Safari Web Inspector for iOS.

## Known issues
* On iOS the sign in doesn't work the very first time after installing app. See details above.
* On iOS removing local video (with toggleVideo API) also stops incoming remote video stream.
* On iOS video container is rendered in landscape even if video stream is portrait. Haven't looked into it yet.

### TODO
* Group calls
* Check out ngx-cordova-oauth plugin even though its using inappbrowser
