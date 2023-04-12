import React, { useState } from 'react';

export const MessageItem = ({ message }) => {
  const type = message.messageType.toLowerCase();
  const self = '_self';
  const time = timeStampConverter(message.createdDateTime);

  return (
    <div className={'message_item_' + type + self}>
      {type != 'server' && self == '' && <span className="message_item_username">{message.userRoom}</span>}
      <div className={'message_content_' + type + self}>
        <span className="message_content_value">{message.content}</span>
        <span>{time}</span>
      </div>
    </div>
  );
};

export const timeStampConverter = time => {
  const date = new Date(time);
  const minute = date.getMinutes();
  const hour = date.getHours();
  return `${hour}:${minute}`;
};
