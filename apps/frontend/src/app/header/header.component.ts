import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'xmas-leds-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {

  links: { path?: string; label: string; icon: string; selected: boolean }[] = [];

  constructor(private _router: Router) {

  }

  ngOnInit(): void {

    // Calculate links
    const newLinks: { path?: string; label: string; icon: string; selected: boolean }[] = [];
    this._router.config.forEach((obj) => {
      if (obj && !obj.redirectTo && obj.data && obj.data['menu'] ) {
        newLinks.push({
          path: obj.path,
          label: obj.data['label'],
          icon: obj.data['icon'],
          selected: false,
        });
      }
    });
    this.links = newLinks;

    this._router.events.subscribe((data) => {
      //console.log(data.constructor.name);
      if (data instanceof NavigationEnd) {
        this.links.forEach((link) => {
          link.selected = '/' + link.path === data.urlAfterRedirects;
        });
      }
    });
  }
}
