const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname);
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: `${filePath}/out/Oregon_Social_Workers_Contact_List.csv`,
  header: [
    { id: 'email', title: 'email' },
    { id: 'firstName', title: 'first_name' },
    { id: 'lastName', title: 'last_name' },
    { id: 'licenseType', title: 'license_type' },
  ],
});

let contacts = [];

fs.createReadStream(`${filePath}/in/Oregon_Social_Workers_Mailing_List.csv`)
  .pipe(csv())
  .on('data', row => {
    if (row['Public Email Address'] !== 'N/A') {
      const vals = Object.values(row);
      const contactOut = {
        email: row['Public Email Address'],
        firstName: vals[0],
        lastName: row['Last Name'],
        licenseType: row['License Type'],
      };

      contacts.push(contactOut);
    }
  })
  .on('end', () => {
    console.log(contacts.length);
    csvWriter
      .writeRecords(contacts)
      .then(() => console.log('The CSV file was written successfully'));
    console.log('CSV file successfully processed');
  });
