import { describe, it, expect } from 'vitest';
import { resetPasswordEmail } from '../../../src/utils/email-templates.js';

describe('Email Templates Unit Tests', () => {
  describe('resetPasswordEmail()', () => {
    const clientURL = 'http://localhost:5173';
    const token = 'plain-token';

    it('should return an object with the correct subject', () => {
      const result = resetPasswordEmail(clientURL, token);
      expect(result.subject).toBe('Reset your password');
    });

    it('should inject the clientUrl and token into the email body link', () => {
      const result = resetPasswordEmail(clientURL, token);

      const expectedHref = `href='${clientURL}/reset-password?token=${token}'`;
      expect(result.body).toContain(expectedHref);
    });

    it('should contain the expiration notice', () => {
      const result = resetPasswordEmail(clientURL, token);
      expect(result.body).toContain('This link is available for 15 minutes');
    });

    it('should return a string for the emailBody', () => {
      const result = resetPasswordEmail(clientURL, token);
      expect(typeof result.body).toBe('string');
    });
  });
});
