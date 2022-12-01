import { Route } from '@angular/router';
import { AnalyseComponent } from './analyse/analyse.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const appRoutes: Route[] = [
  { path: '',               redirectTo: '/analyse', pathMatch: 'full'},
  { path: 'analyse',          component: AnalyseComponent                ,                                data: {label: 'route.analyse'   , menu: false}},
  // Show the 404 page for any routes that don't exist.
  { path: '**',           component: NotFoundComponent, data: {label: 'route.not-found', menu: false} }

];
