import { useState, useRef } from 'react';

const mimeType: MediaRecorderOptions['mimeType'] = 'audio/webm';

interface Props {
  onStopRecording: (audio: Blob) => void;
}

const AudioRecorder = ({ onStopRecording }: Props) => {
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | undefined>(undefined);
  const mediaRecorder = useRef<any>(null);
  const [recordingStatus, setRecordingStatus] = useState('inactive');
  const [audioChunks, setAudioChunks] = useState([]);
  const [audio, setAudio] = useState('');

  const startRecording = async () => {
    setRecordingStatus('recording');
    //create new Media recorder instance using the stream
    let media: MediaRecorder | undefined;
    if (stream) {
      media = new MediaRecorder(stream, { mimeType });
    }
    //set the MediaRecorder instance to the mediaRecorder ref
    mediaRecorder.current = media;
    //invokes the start method to start the recording process
    mediaRecorder.current.start();
    let localAudioChunks: any = [];
    mediaRecorder.current.ondataavailable = (event: any) => {
      if (typeof event.data === 'undefined') return;
      if (event.data.size === 0) return;
      localAudioChunks.push(event.data);
    };
    setAudioChunks(localAudioChunks);
  };

  const stopRecording = () => {
    setRecordingStatus('inactive');
    //stops the recording instance
    mediaRecorder.current.stop();
    mediaRecorder.current.onstop = () => {
      //creates a blob file from the audiochunks data
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      onStopRecording(audioBlob);
      //creates a playable URL from the blob file.
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudio(audioUrl);
      setAudioChunks([]);
    };
  };

  const getMicrophonePermission = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(streamData);
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      alert('The MediaRecorder API is not supported in your browser.');
    }
  };
  return (
    <div>
      <div className="audio-controls">
        {!permission ? (
          <button
            type="button"
            onClick={getMicrophonePermission}
            style={{
              outline: 'none',
              padding: '20px',
              border: 'none',
              background: 'mediumslateblue',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Get Microphone
          </button>
        ) : null}
        {permission && recordingStatus === 'inactive' ? (
          <button
            type="button"
            style={{
              outline: 'none',
              padding: '20px',
              border: 'none',
              background: 'mediumslateblue',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            onClick={startRecording}
          >
            Record
          </button>
        ) : null}
        {recordingStatus === 'recording' ? (
          <button
            onClick={stopRecording}
            type="button"
            style={{
              outline: 'none',
              padding: '20px',
              border: 'none',
              background: 'mediumslateblue',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Stop Recording
          </button>
        ) : null}
      </div>
    </div>
  );
};
export default AudioRecorder;
