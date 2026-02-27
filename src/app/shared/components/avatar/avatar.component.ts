import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-avatar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.css']
})
export class AvatarComponent {
    @Input() src: string = '';
    @Input() alt: string = 'Avatar';
    @Input() size: number = 40;
}
