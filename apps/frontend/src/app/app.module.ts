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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { HeaderComponent } from './header/header.component';

@NgModule({
  declarations: [AppComponent, StatusComponent, NotificationComponent, HeaderComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    NotFoundModule,
    AnalyseModule,
    VisuModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
