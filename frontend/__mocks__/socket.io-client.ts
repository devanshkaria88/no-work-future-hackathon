const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  off: jest.fn(),
};

export const io = jest.fn(() => mockSocket);
export default { io };
export { mockSocket };
