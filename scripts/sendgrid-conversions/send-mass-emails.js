const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const filePath = path.join(__dirname);

let contacts = [
  'peyton.hobson@carevine.us',
  'janelle.leavell1@gmail.com',
  'patrick.hobson@carevine.us',
];
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

fs.createReadStream(`${filePath}/out/Oregon_Nursing_Contact_List.csv`)
  .pipe(csv())
  .on('data', async row => {
    if (row.email.includes('@')) {
      contacts.push(row.email);
    }
  })
  .on('end', () => {
    const splits = Math.ceil(contacts.length / 1000);

    // const toSend = contacts.slice(i * 1000, (i + 1) * 1000);

    // console.log(toSend.length);s

    const msg = {
      from: 'CareVine@carevine-mail.us',
      to: 'peyton.hobson@carevine.us',
      template_id: 'd-accd3ced34404fdb94aa12e95a35941d',
      category: 'Testing',
      asm: {
        group_id: 22860,
      },
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log('Emails sent successfully');
      })
      .catch(error => {
        console.log(error?.response?.body?.errors);
      });
  });
