export interface IMessage {
  message: string;
  isHuman: boolean;
  contentType: 'text' | 'image' | 'audio';
}
