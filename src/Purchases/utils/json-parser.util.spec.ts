import { parseGeminiJson } from './json-parser.util';

describe('json-parser.util', () => {
  describe('parseGeminiJson', () => {
    it('should parse valid JSON', () => {
      const input = '{"key": "value"}';
      const result = parseGeminiJson(input);
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse JSON with markdown code blocks', () => {
      const input = '```json\n{"key": "value"}\n```';
      const result = parseGeminiJson(input);
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle JSON with extra whitespace', () => {
      const input = '  \n  {"key": "value"}  \n  ';
      const result = parseGeminiJson(input);
      expect(result).toEqual({ key: 'value' });
    });

    it('should extract JSON from mixed content', () => {
      const input = 'Some text before\n{"key": "value"}\nSome text after';
      const result = parseGeminiJson(input);
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle nested JSON objects', () => {
      const input = '{"outer": {"inner": "value"}}';
      const result = parseGeminiJson(input);
      expect(result).toEqual({ outer: { inner: 'value' } });
    });

    it('should handle JSON arrays', () => {
      const input = '{"items": [1, 2, 3]}';
      const result = parseGeminiJson(input);
      expect(result).toEqual({ items: [1, 2, 3] });
    });

    it('should return empty object for invalid JSON', () => {
      const input = 'This is not JSON at all';
      const result = parseGeminiJson(input);
      expect(result).toEqual({});
    });

    it('should return empty object for empty string', () => {
      const input = '';
      const result = parseGeminiJson(input);
      expect(result).toEqual({});
    });

    it('should handle JSON with escaped characters', () => {
      const input = '{"message": "Line 1\\nLine 2"}';
      const result = parseGeminiJson(input);
      expect(result).toEqual({ message: 'Line 1\nLine 2' });
    });
  });
});
