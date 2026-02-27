export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    timestamp: Date;
    status: 'sent' | 'delivered' | 'read';
}
