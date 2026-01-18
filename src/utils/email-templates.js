export const resetPasswordEmail = (clientURL, token) => ({
  subject: 'Reset your password',
  body: `
    <p>Click the link below to reset your password</p>
    <a href='${clientURL}/reset-password?token=${token}'>
      This link is available for 15 minutes
    </a>
  `,
});
