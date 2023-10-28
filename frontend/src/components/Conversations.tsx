import { IMessage } from '../types';
import ChatBubble from './ChatBubble';
import ChatBubble2 from './ChatBubble2';

interface IProps {
  conversations: IMessage[];
  aiMessage: IMessage;
  loading: boolean;
  status: string;
}

let agent = false;
export default function Conversations({
  conversations,
  aiMessage,
  loading,
  status,
}: IProps) {
  return (
    <div
      style={{
        width: '70%',
        height: '90%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        margin: '0 auto',
        background: '#625a91',
      }}
    >
      <div
        style={{
          maxHeight: '800px',
          overflowY: 'auto',
          padding: '30px',
        }}
      >
        {conversations &&
          conversations.map((conversation, index) => {
            return agent ? (
              <ChatBubble
                isHuman={conversation.isHuman}
                message={conversation}
                loading={false}
                status={''}
                key={index}
              />
            ) : (
              <ChatBubble2
                isHuman={conversation.isHuman}
                message={conversation}
                loading={false}
                status={''}
                key={index}
              />
            );
          })}
        {(aiMessage.message || status || loading) &&
          (agent ? (
            <ChatBubble
              isHuman={false}
              message={aiMessage}
              loading={loading}
              status={status}
            />
          ) : (
            <ChatBubble2
              isHuman={false}
              message={aiMessage}
              loading={loading}
              status={status}
            />
          ))}
      </div>
    </div>
  );
}
