import React, { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';

export const MessageList = ({ messageList }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
  }, [messageList]);

  return (
    <div className="message_list">
      {messageList.map((x, idx) => (
        <MessageItem key={idx} message={x} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
