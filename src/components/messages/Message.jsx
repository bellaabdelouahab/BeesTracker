import React, { useEffect, useState } from 'react';
import { useSocket } from '../../costumHook/useSocket';
import { useFetch } from '../../costumHook/useFetch';
import { MessageList } from './MessageList';



const Message = ({ room }) => {
  const { isConnected, socketResponse, sendData } = useSocket(room);
  const [messageInput, setMessageInput] = useState('');
  const [messageList, setMessageList] = useState([]);

  const { responseData } = useFetch('/message/' + room);

  useEffect(() => {
    if (responseData) {
      setMessageList([...responseData, ...messageList]);
    }
  }, [responseData]);

  useEffect(() => {
    console.log('Socket Response: ', socketResponse);
    addMessageToList(socketResponse);
  }, [socketResponse]);

  const addMessageToList = (val) => {
    if (val.room === '') return;
    setMessageList(prevList => [...prevList, val]);

  };


  return (
    <div className="message_root_div">
      <span className="room_name">Room: {room} </span>
      <span className="user_name">Welcome:  </span>
      <div className="message_component">
        <MessageList messageList={messageList} />
        <form className="chat-input" >
          <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder="Type a message" />
          <button type="submit">
            {/* {messageInput === '' ? <RiSendPlaneLine size={25} /> : <RiSendPlaneFill color="#2671ff" size={25} />} */}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Message;


export const timeStampConverter = time => {
  const date = new Date(time);
  const minute = date.getMinutes();
  const hour = date.getHours();
  return `${hour}:${minute}`;
};
