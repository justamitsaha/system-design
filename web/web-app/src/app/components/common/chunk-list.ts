import { Component, input } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';

@Component({
    selector: 'app-chunk-list',
    standalone: true,
    imports: [DecimalPipe, SlicePipe],
    templateUrl: './chunk-list.html',
})
export class ChunkList {
    chunks = input.required<any[]>();
    emptyMessage = input<string>('No items.');
}