import { CSSProperties } from 'react';
import BounceLoader from 'react-spinners/BounceLoader';
import { IMessage } from '../types';
import { replaceUrls } from '../utils';

interface Props {
  isHuman: boolean;
  message: IMessage;
  loading: boolean;
  status: string;
}

export default function ChatBubble({
  isHuman,
  message,
  loading,
  status,
}: Props) {
  const { text, urls } = replaceUrls(message.message, '');
  let image = urls?.[0];
  let text1 = text;
  if (image?.endsWith(')')) image = image?.slice(0, image?.length - 1);
  if (image) text1 = text.split(':')?.[0];
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: isHuman ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          width: 'fit-content',
          maxWidth: 800,
          // minWidth: 200,
          background: isHuman ? 'lightblue' : 'white',
          padding: '10px',
          borderRadius: '10px',
          margin: '14px',
          color: 'black',
          fontFamily: 'sans-serif',
          fontWeight: '400',
          position: 'relative',
          display: 'flex',
        }}
      >
        {!isHuman && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <BounceLoader color={'#3784d7'} loading={loading} size={30} />
            {status && (
              <p
                style={{
                  fontStyle: 'italic',
                  fontWeight: 'bold',
                  color: 'blue',
                }}
              >
                {status}...
              </p>
            )}
          </div>
        )}
        {message.contentType === 'text' && (
          <div>
            <span
              style={{
                fontSize: 17,
                letterSpacing: '1px',
                lineHeight: '1.4rem',
              }}
            >
              {message.message
                ? text1
                : loading
                ? ''
                : "I couldn't find any results"}
            </span>
            <div style={{ marginTop: image ? 10 : 0 }}>
              {image && (
                <img
                  src={image}
                  style={{ width: 512, height: 512, objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        )}
        {message.contentType === 'image' && (
          <img
            src={message.message}
            style={{ width: 512, height: 512, objectFit: 'contain' }}
          />
        )}
        {message.contentType === 'audio' && (
          <audio src={message.message} controls></audio>
        )}
      </div>
    </div>
  );
}
