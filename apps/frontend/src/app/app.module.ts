import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { appRoutes } from './app.routes';
import { NotFoundModule } from './not-found/not-found.module';
import { AnalyseModule } from './analyse/analyse.module';
import { HttpClientModule } from '@angular/common/http';
import { VisuModule } from './visu/visu.module';
import { StatusComponent } from './status/status.component';
import { NotificationComponent } from './notification/notification.component';

@NgModule({
  declarations: [AppComponent, StatusComponent, NotificationComponent],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }), NotFoundModule, AnalyseModule, VisuModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
