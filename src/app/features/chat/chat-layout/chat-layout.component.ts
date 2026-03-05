import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ChatWindowComponent } from '../chat-window/chat-window.component';
import { ChatService } from '../../../core/services/chat.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chat-layout',
    standalone: true,
    imports: [CommonModule, SidebarComponent, ChatWindowComponent],
    templateUrl: './chat-layout.component.html',
    styleUrls: ['./chat-layout.component.css']
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
    isChatOpen = false;
    private sub!: Subscription;

    constructor(private chatService: ChatService) { }

    ngOnInit() {
        this.sub = this.chatService.activeChat$.subscribe((chat: any) => {
            this.isChatOpen = !!chat;
        });
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }
}
