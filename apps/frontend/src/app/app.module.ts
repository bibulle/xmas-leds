import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AnalyseModule } from './analyse/analyse.module';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { HeaderComponent } from './header/header.component';
import { NotFoundModule } from './not-found/not-found.module';
import { NotificationComponent } from './notification/notification.component';
import { ProgModule } from './prog/prog.module';
import { StatusComponent } from './status/status.component';
import { TreeModule } from './tree/tree.module';
import { VisuModule } from './visu/visu.module';


@NgModule({
  declarations: [AppComponent, StatusComponent, NotificationComponent, HeaderComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatExpansionModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    NotFoundModule,
    AnalyseModule,
    TreeModule,
    VisuModule,
    ProgModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
