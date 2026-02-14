import { Component, input } from '@angular/core';

@Component({
    selector: 'app-bootstrap-card',
    standalone: true,
    templateUrl: './bootstrap-card.html',
})
export class BootstrapCard {
    header = input.required<string>();
}