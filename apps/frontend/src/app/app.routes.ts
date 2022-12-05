import { Route } from '@angular/router';
import { AnalyseComponent } from './analyse/analyse.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { VisuComponent } from './visu/visu.component';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/visu', pathMatch: 'full' },
  { path: 'visu', component: VisuComponent, data: { label: 'route.visu', menu: true } },
  { path: 'analyse', component: AnalyseComponent, data: { label: 'route.analyse', menu: false } },
  // Show the 404 page for any routes that don't exist.
  { path: '**', component: NotFoundComponent, data: { label: 'route.not-found', menu: false } },
];
