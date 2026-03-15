import { io, Socket } from 'socket.io-client';

export function createTestWSClient(port: number): Socket {
  return io(`http://localhost:${port}`, {
    path: '/ws',
    transports: ['websocket'],
    autoConnect: false,
  });
}

export function waitForEvent(
  socket: Socket,
  event: string,
  timeout = 5000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for ${event}`)),
      timeout,
    );
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

export function collectEvents(
  socket: Socket,
  event: string,
  count: number,
  timeout = 10000,
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const events: any[] = [];
    const timer = setTimeout(
      () => reject(new Error(`Timeout: got ${events.length}/${count} ${event} events`)),
      timeout,
    );
    socket.on(event, (data) => {
      events.push(data);
      if (events.length >= count) {
        clearTimeout(timer);
        resolve(events);
      }
    });
  });
}
