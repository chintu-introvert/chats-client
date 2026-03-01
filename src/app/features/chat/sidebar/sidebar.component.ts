import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, FormsModule, AvatarComponent, IconComponent, ChatListComponent],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
    currentUser$!: User;
    allUsers: User[] = [];
    searchQuery: string = '';

    constructor(
        private chatService: ChatService,
        private authService: AuthService
    ) {
        this.currentUser$ = this.chatService.getCurrentUser();
    }

    ngOnInit() {
        this.fetchUserList();
    }

    // fetch user list
    fetchUserList() {
        this.chatService.getUsers().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.allUsers = res?.data;
                }
                console.log(this.allUsers, 'user list');

            },
            error: (err) => {
                console.log(err, ' error while fetching user list');
            }
        });
    }

    get filteredUsers(): User[] {
        if (!this.searchQuery.trim()) {
            return [];
        }
        const query = this.searchQuery.toLowerCase();
        return this.allUsers.filter(user =>
            user.id !== this.currentUser$?.id &&
            user.name.toLowerCase().includes(query)
        );
    }

    startChat(user: User) {
        this.chatService.createOrOpenChat(user);
        this.searchQuery = ''; // Clear search after selecting
    }

    get userBio(): string {
        const u = this.currentUser$;
        return u?.bio || u?.status || 'Hey there! I am using Chats.';
    }

    logout(): void {
        this.authService.logout();
    }
}
