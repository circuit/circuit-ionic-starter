import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { CircuitService } from '../providers/circuit.service';
import {SafeUrlPipe} from '../pipes/safeurl.pipe';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { VideoCallComponent } from '../pages/video-call/video-call.component';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    VideoCallComponent,
    SafeUrlPipe
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    VideoCallComponent
  ],
  providers: [
    CircuitService,
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
