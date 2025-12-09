import { Route } from '@angular/router';
import { AnalyzeComponent } from './analyse/analyse.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { VisuComponent } from './visu/visu.component';
import { ProgComponent } from './prog/prog.component';
import { AdminComponent } from './admin/admin.component';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/prog', pathMatch: 'full' },
  { path: 'calc', component: VisuComponent, data: { label: 'Calcul', menu: true } },
  { path: 'prog', component: ProgComponent, data: { label: 'Programme', menu: true } },
  { path: 'analyze', component: AnalyzeComponent, data: { label: 'Analyse', menu: true } },
  { path: 'admin', component: AdminComponent, data: { label: 'Admin', menu: true } },
  // Show the 404 page for any routes that don't exist.
  { path: '**', component: NotFoundComponent, data: { label: 'route.not-found', menu: false } },
];
