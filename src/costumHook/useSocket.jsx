import { useCallback, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';


const SOCKET_BASE_URL = "ws://192.168.254.214:8089";





export const useSocket = (room, username) => {
  const [socket, setSocket] = useState();
  const [socketResponse, setSocketResponse] = useState({
    room: '',
    content: '',
    username: '',
    messageType: '',
    createdDateTime: '',
  });
  const [isConnected, setConnected] = useState(false);

  const sendData = useCallback(
    (payload )=>{
        if(socket === undefined) return;
        else console.log('message is defined');

        console.log('socket: ', socket);
        console.log('room: ', room);
        console.log('payload: ', payload);
        
        socket.emit('send_message', {
          room,
          content: payload.content,
          username,
          messageType: 'CLIENT',
        });
    },
    [socket, room]
  );

  useEffect(() => {
    const query = { username, room };

    const s = io(SOCKET_BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      transports: ['websocket'],
      query: query,
    });

    setSocket(s);
    setConnected(true);
    s.connect();
    console.log('socket: ', s);
    
    s.on('read_message', (res) => {
      setSocketResponse(res);
    });
    s.on('connect', () => {
      console.log('connected');
    });
    s.on('send_message', (res) => {
      setSocketResponse(res);
    });
    s.on('disconnect', () => {
      console.log('disconnected');
    });
    console.log("url is: ", SOCKET_BASE_URL);
    s.emit('join_room', { room, username });
    s.on('connect_error', err => {
      console.log(`connect_error due to ${err.message}`);
    });
    // return () => {
    //   s.disconnect();
    // };
  }, [room, username]);

  return { socketResponse, isConnected, sendData };
};

