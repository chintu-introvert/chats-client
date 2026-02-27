import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatLayoutComponent } from './features/chat/chat-layout/chat-layout.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('chats-client');
}
