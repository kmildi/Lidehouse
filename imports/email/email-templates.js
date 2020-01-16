import { Notification_Email } from './notification-email.js';
import { Voteexpires_Email } from './voteexpires-email.js';
import { BillNotification_Email } from './billnotification-email.js';
import { OutstandingNotification_Email } from './outstandingnotification-email.js';

export const EmailTemplates = {
  Notification_Email, Voteexpires_Email, BillNotification_Email, OutstandingNotification_Email,
};

// -------------- Sample -------------------
/*
export const SampleEmailTemplates = {
  sample: {
    path: 'sample-email/template.html',    // Relative to the 'private' dir.
    scss: 'sample-email/style.scss',       // Mail specific SCSS.

    helpers: {
      capitalizedName() {
        return this.name.charAt(0).toUpperCase() + this.name.slice(1);
      },
    },

    route: {
      path: '/sample/:name',
      data: params => ({
        name: params.name,
        names: ['Johan', 'John', 'Paul', 'Ringo'],
      }),
    },
  },
};
*/
