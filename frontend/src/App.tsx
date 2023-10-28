import { useState } from 'react';
import InputForm from './components/InputFrom';
import Conversations from './components/Conversations';
import { IMessage } from './types';
import AudioRecorder from './components/AudioRecorder';

const defaultMessage: IMessage = {
  contentType: 'text',
  message: '',
  isHuman: false,
};

export default function App() {
  const [conversations, setConversations] = useState<IMessage[]>([]); // To track all the conversations
  const [aiMessage, setAiMessage] = useState<IMessage>(defaultMessage); // To store the new AI responses
  const [userMessage, setUserMessage] = useState(''); // To store the message sent by the user
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<Blob | undefined>(undefined);

  const onStopRecording = (audio: Blob) => {
    // setAudio(audio)
    submitAudio(audio);
  };

  const handleRes = async (res: Response) => {
    if (!res.ok || !res.body) {
      setLoading(false);
      console.log('Error in response');
      return;
    }

    let streamedMessage: IMessage = {
      contentType: 'text',
      message: '',
      isHuman: false,
    };
    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const decoded = JSON.parse(new TextDecoder('utf-8').decode(value)) as {
        type: 'status' | 'partial' | 'response';
        contentType: 'image' | 'text';
        content: string;
      };
      console.log('decoded', decoded);

      if (decoded.type === 'status') {
        setStatus(decoded.content);
      }

      if (decoded.type === 'partial' || decoded.type === 'response') {
        streamedMessage = {
          ...streamedMessage,
          contentType: decoded.contentType,
          message: (streamedMessage.message += decoded.content),
        };
        setAiMessage((prev) => ({
          ...prev,
          contentType: decoded.contentType,
          message:
            decoded.contentType === 'image'
              ? decoded.content?.[0]
              : prev.message + decoded.content,
        }));
      }
    }

    setConversations((prev) => {
      return [...prev, streamedMessage];
    });

    setAiMessage(defaultMessage);
    setStatus('');
    setLoading(false);
  };

  const submitAudio = async (audio: Blob) => {
    console.log('audio', audio);
    if (!audio) return;
    setLoading(true);
    const audioUrl = URL.createObjectURL(audio);
    setConversations((value) => [
      ...value,
      { isHuman: true, message: audioUrl, contentType: 'audio' },
    ]);

    var fd = new FormData();
    fd.append('file', audio as Blob);

    const res = await fetch('http://localhost:3001/chat/audio', {
      headers: { Accept: 'application/json' },
      method: 'POST',
      body: fd,
    });

    await handleRes(res);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    try {
      e.preventDefault();
      setConversations((value) => [
        ...value,
        { isHuman: true, message: userMessage, contentType: 'text' },
      ]);
      setUserMessage('');
      setLoading(true);
      setStatus('');

      const res = await fetch('http://ai:3001/chat', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage }),
      });

      await handleRes(res);
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'darkslateblue',
      }}
    >
      {/* Conversations section */}
      <Conversations
        conversations={conversations}
        aiMessage={aiMessage}
        loading={loading}
        status={status}
      />
      {/* Message input */}
      <div
        style={{
          width: '70%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          paddingBottom: 10,
          background: '#625a91',
        }}
      >
        <InputForm
          userMessage={userMessage}
          setUserMessage={setUserMessage}
          handleSubmit={handleSubmit}
        />
        <AudioRecorder onStopRecording={onStopRecording} />
      </div>
    </div>
  );
}
