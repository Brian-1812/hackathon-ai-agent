interface IProps {
  userMessage: string;
  setUserMessage: (value: string) => void;
  handleSubmit: React.FormEventHandler<HTMLFormElement>;
}

export default function InputForm({
  userMessage,
  setUserMessage,
  handleSubmit,
}: IProps) {
  return (
    <form
      style={{
        width: '60%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        background: 'white',
        marginRight: 10,
      }}
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        placeholder="Ask something..."
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        style={{
          width: '90%',
          outline: 'none',
          padding: '20px',
          border: 'none',
        }}
      ></input>
      <button
        type="submit"
        style={{
          width: '10%',
          outline: 'none',
          padding: '20px',
          border: 'none',
          background: 'mediumslateblue',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        Send
      </button>
    </form>
  );
}
