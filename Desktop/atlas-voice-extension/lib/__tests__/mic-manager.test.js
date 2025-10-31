/**
 * Tests for MicManager
 */

import { MicManager } from '../mic-manager.js';

describe('MicManager', () => {
  let micManager;

  beforeEach(() => {
    micManager = MicManager;
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="mic-permission-banner" style="display: none;"></div>
      <button id="mic-permission-try-again"></button>
      <button id="mic-permission-dismiss"></button>
    `;
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('should be defined', () => {
    expect(MicManager).toBeDefined();
  });

  test('ensureMic should request stream when none cached', async () => {
    // Mock navigator.mediaDevices.getUserMedia
    const mockStream = { active: true, getTracks: () => [] };
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue(mockStream)
    };

    const stream = await MicManager.ensureMic();
    expect(stream).toBe(mockStream);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  test('ensureMic should return cached stream if active', async () => {
    const mockStream = { active: true, getTracks: () => [] };
    MicManager.getCachedStream = jest.fn().mockReturnValue(mockStream);

    const stream = await MicManager.ensureMic();
    expect(stream).toBe(mockStream);
  });

  test('should handle permission denied error', async () => {
    const mockError = new Error('Permission denied');
    mockError.name = 'NotAllowedError';

    global.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockRejectedValue(mockError)
    };

    await expect(MicManager.ensureMic()).rejects.toThrow('Microphone permission was blocked');
  });

  test('clearCache should stop tracks and clear cache', () => {
    const mockTrack = { stop: jest.fn() };
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([mockTrack])
    };

    MicManager.getCachedStream = jest.fn().mockReturnValue(mockStream);

    MicManager.clearCache();

    expect(mockTrack.stop).toHaveBeenCalled();
  });
});