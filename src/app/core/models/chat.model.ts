import { User } from './user.model';
import { Message } from './message.model';

export interface Chat {
    id: string;
    participants: User[];
    isGroup: boolean;
    groupName?: string;
    groupAvatar?: string;
    lastMessage?: Message;
    unreadCount: number;
}
