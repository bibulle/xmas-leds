import { Route } from '@angular/router';
import { AnalyseComponent } from './analyse/analyse.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { VisuComponent } from './visu/visu.component';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/prog', pathMatch: 'full' },
  { path: 'calc', component: VisuComponent, data: { label: 'Calcul', menu: true } },
  { path: 'prog', component: VisuComponent, data: { label: 'Programme', menu: true } },
  { path: 'analyse', component: AnalyseComponent, data: { label: 'Analyse', menu: true } },
  // Show the 404 page for any routes that don't exist.
  { path: '**', component: NotFoundComponent, data: { label: 'route.not-found', menu: false } },
];
