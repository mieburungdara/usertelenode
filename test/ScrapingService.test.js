// test/ScrapingService.test.js
const { ScrapingService } = require('../src/domain/services/ScrapingService');

describe('ScrapingService', () => {
  it('should scrape channel', async () => {
    const mockClient = { getMessages: jest.fn().mockResolvedValue([]) };
    const mockRepo = { saveHistory: jest.fn() };
    const service = new ScrapingService(mockClient, mockRepo);
    const result = await service.scrapeChannel('test', 0);
    expect(result.messages).toBe(0);
  });
});