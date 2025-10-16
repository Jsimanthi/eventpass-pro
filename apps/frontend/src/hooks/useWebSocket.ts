import { useEffect, useState, useRef } from 'react';

const useWebSocket = (url: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const webSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    webSocketRef.current = new WebSocket(url);

    webSocketRef.current.onopen = () => {
      console.log('WebSocket connection established.');
    };

    webSocketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    webSocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);

    };

    webSocketRef.current.onclose = () => {
      console.log('WebSocket connection closed.');
    };

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [url]);

  return messages;
};

export default useWebSocket;
