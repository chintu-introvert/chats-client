import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-icon',
    standalone: true,
    template: `
    <span class="icon" [style.width.px]="size" [style.height.px]="size" [style.color]="color" [innerHTML]="svgContentSafe"></span>
  `,
    styles: [`
    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: inherit;
      flex-shrink: 0;
    }
    .icon ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
  `]
})
export class IconComponent {
    @Input() name: string = '';
    @Input() size: number = 24;
    @Input() color: string = 'var(--wa-icon-color)';

    get svgContentSafe(): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.svgContent);
    }

    constructor(private sanitizer: DomSanitizer) {}

    get svgContent(): string {
        // A simple registry of SVG paths for common WhatsApp icons
        const icons: Record<string, string> = {
            'search': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.8 0a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"></path></svg>',
            'menu': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><circle cx="12" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18" r="2"/></svg>',
            'status': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2.016A9.92 9.92 0 0 0 2.016 12 9.92 9.92 0 0 0 12 21.984 9.92 9.92 0 0 0 21.984 12 9.92 9.92 0 0 0 12 2.016zM12 20.25a8.25 8.25 0 1 1 0-16.5 8.25 8.25 0 0 1 0 16.5z"></path></svg>',
            'chat': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-.616 2.064-1.648V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"></path></svg>',
            'attach': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.57.57 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"></path></svg>',
            'smiley': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.379 0-4.782-1.08-5.082-1.954 6.065 1.05 10.133 0 10.133 0zm-1.503-2.47c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zM12 2A10 10 0 1 0 22 12 10 10 0 0 0 12 2zm0 18.3A8.3 8.3 0 1 1 20.3 12 8.3 8.3 0 0 1 12 20.3z"></path></svg>',
            'send': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>',
            'logout': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path></svg>',
            'account': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>'
        };
        return icons[this.name] || '';
    }
}
