import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { appRoutes } from './app.routes';
import { NotFoundModule } from './not-found/not-found.module';
import { AnalyseModule } from './analyse/analyse.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    NotFoundModule,
    AnalyseModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
