import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export const sanitizeHTML = (property) => {
  return (req, res, next) => {
    if (req.body[property]) {
      req.body[property] = DOMPurify.sanitize(req.body[property], {
        ALLOWED_TAGS: [
          'p',
          'br',
          'strong',
          'em',
          'u',
          's',
          'span',
          'img',
          'a',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ol',
          'ul',
          'li',
          'blockquote',
          'pre',
          'sub',
          'sup',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'title'],
        ADD_ATTR: ['target', 'rel'],
        FORBID_ATTR: ['style'],
      });
    }
    next();
  };
};
