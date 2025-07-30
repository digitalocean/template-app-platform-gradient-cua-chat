import { PingAwareTransportWrapper } from './mcp-transport';
import type { JSONRPCMessage, JSONRPCResponse, MCPTransport } from 'ai';

describe('PingAwareTransportWrapper', () => {
  let mockTransport: MCPTransport;
  let wrapper: PingAwareTransportWrapper;
  let mockSend: jest.Mock;
  let mockStart: jest.Mock;
  let mockClose: jest.Mock;

  beforeEach(() => {
    // Create mock transport
    mockSend = jest.fn().mockResolvedValue(undefined);
    mockStart = jest.fn().mockResolvedValue(undefined);
    mockClose = jest.fn().mockResolvedValue(undefined);
    
    mockTransport = {
      send: mockSend,
      start: mockStart,
      close: mockClose,
    };

    // Create wrapper
    wrapper = new PingAwareTransportWrapper(mockTransport);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should proxy handlers from original transport', () => {
      const onMessage = jest.fn();
      const onClose = jest.fn();
      const onError = jest.fn();

      wrapper.onmessage = onMessage;
      wrapper.onclose = onClose;
      wrapper.onerror = onError;

      // Simulate original transport callbacks
      mockTransport.onclose?.();
      expect(onClose).toHaveBeenCalled();

      const error = new Error('Test error');
      mockTransport.onerror?.(error);
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('ping handling', () => {
    it('should handle ping messages with ID', async () => {
      const onMessage = jest.fn();
      wrapper.onmessage = onMessage;

      const pingMessage: JSONRPCMessage = {
        jsonrpc: '2.0',
        id: 123,
        method: 'ping',
      };

      // Simulate ping message from transport
      mockTransport.onmessage?.(pingMessage);

      // Should send pong response
      expect(mockSend).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        id: 123,
        result: {},
      });

      // Should NOT pass ping to application
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('should not respond to ping notifications (without ID)', async () => {
      const onMessage = jest.fn();
      wrapper.onmessage = onMessage;

      const pingNotification: JSONRPCMessage = {
        jsonrpc: '2.0',
        method: 'ping',
      };

      // Simulate ping notification from transport
      mockTransport.onmessage?.(pingNotification);

      // Should NOT send any response
      expect(mockSend).not.toHaveBeenCalled();

      // Should NOT pass ping to application
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('should handle ping response errors', async () => {
      const onError = jest.fn();
      wrapper.onerror = onError;

      const error = new Error('Send failed');
      mockSend.mockRejectedValueOnce(error);

      const pingMessage: JSONRPCMessage = {
        jsonrpc: '2.0',
        id: 456,
        method: 'ping',
      };

      // Simulate ping message
      mockTransport.onmessage?.(pingMessage);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should report error
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('message passing', () => {
    it('should pass non-ping messages to application', () => {
      const onMessage = jest.fn();
      wrapper.onmessage = onMessage;

      const regularMessage: JSONRPCMessage = {
        jsonrpc: '2.0',
        id: 789,
        method: 'tools/list',
      };

      // Simulate regular message
      mockTransport.onmessage?.(regularMessage);

      // Should pass to application
      expect(onMessage).toHaveBeenCalledWith(regularMessage);
      
      // Should NOT send any response
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should pass response messages to application', () => {
      const onMessage = jest.fn();
      wrapper.onmessage = onMessage;

      const response: JSONRPCResponse = {
        jsonrpc: '2.0',
        id: 999,
        result: { tools: [] },
      };

      // Simulate response message
      mockTransport.onmessage?.(response);

      // Should pass to application
      expect(onMessage).toHaveBeenCalledWith(response);
    });

    it('should handle messages with ping in other fields', () => {
      const onMessage = jest.fn();
      wrapper.onmessage = onMessage;

      const messageWithPingParam: JSONRPCMessage = {
        jsonrpc: '2.0',
        id: 111,
        method: 'someMethod',
        params: { ping: true },
      };

      // Simulate message
      mockTransport.onmessage?.(messageWithPingParam);

      // Should pass to application (not a ping method)
      expect(onMessage).toHaveBeenCalledWith(messageWithPingParam);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('transport methods', () => {
    it('should proxy start method', async () => {
      await wrapper.start();
      expect(mockStart).toHaveBeenCalled();
    });

    it('should proxy send method', async () => {
      const message: JSONRPCMessage = {
        jsonrpc: '2.0',
        id: 222,
        method: 'test',
      };

      await wrapper.send(message);
      expect(mockSend).toHaveBeenCalledWith(message);
    });

    it('should proxy close method', async () => {
      await wrapper.close();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle missing handlers gracefully', () => {
      // Don't set any handlers on wrapper
      const message: JSONRPCMessage = {
        jsonrpc: '2.0',
        id: 333,
        method: 'test',
      };

      // Should not throw
      expect(() => {
        mockTransport.onmessage?.(message);
        mockTransport.onclose?.();
        mockTransport.onerror?.(new Error('Test'));
      }).not.toThrow();
    });

    it('should handle concurrent ping messages', async () => {
      const pingMessages = Array(5).fill(null).map((_, i) => ({
        jsonrpc: '2.0' as const,
        id: i,
        method: 'ping',
      }));

      // Send all pings
      pingMessages.forEach(msg => mockTransport.onmessage?.(msg));

      // Should send all pong responses
      expect(mockSend).toHaveBeenCalledTimes(5);
      pingMessages.forEach((msg, i) => {
        expect(mockSend).toHaveBeenNthCalledWith(i + 1, {
          jsonrpc: '2.0',
          id: i,
          result: {},
        });
      });
    });
  });
});