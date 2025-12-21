import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !API_URL) return;

    try {
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('Socket.IO initialization error:', error);
    }
  }, [user, token]);

  const subscribeToMatch = useCallback((matchId) => {
    if (socket && connected) {
      socket.emit('join_match', { match_id: matchId });
    }
  }, [socket, connected]);

  const unsubscribeFromMatch = useCallback((matchId) => {
    if (socket && connected) {
      socket.emit('leave_match', { match_id: matchId });
    }
  }, [socket, connected]);

  const value = {
    socket,
    connected,
    liveMatches,
    setLiveMatches,
    subscribeToMatch,
    unsubscribeFromMatch
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
