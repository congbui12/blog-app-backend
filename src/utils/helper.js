import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { nanoid } from 'nanoid';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const createToken = () => {
  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000;

  return { plainToken, hashedToken, expiresAt };
};

export const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  await transporter.sendMail({
    from: process.env.GMAIL,
    to,
    subject,
    html,
  });
};

export const sanitizeUser = (userDocument) => {
  if (!userDocument) return null;
  const user =
    typeof userDocument.toObject === 'function' ? userDocument.toObject() : { ...userDocument };

  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordTokenExpiry;
  return user;
};

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const generateSlug = (title) => {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const id = nanoid(6);
  return `${cleanTitle}-${id}`;
};
