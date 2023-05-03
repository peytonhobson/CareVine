const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname);
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: `${filePath}/out/Oregon_Nursing_Contact_List_Remaining.csv`,
  header: [
    { id: 'email', title: 'email' },
    { id: 'firstName', title: 'first_name' },
    { id: 'lastName', title: 'last_name' },
    { id: 'county', title: 'county' },
    { id: 'licenseType', title: 'license_type' },
  ],
  append: true,
});

let contacts = [];

const sentCounties = ['MULTNOMAH', 'WASHINGTON', 'LANE', 'CLACKAMAS'];

fs.createReadStream(`${filePath}/out/Oregon_Nursing_Contact_List_Remaining.csv`)
  .pipe(csv())
  .on('data', row => {
    if (row['email'] !== 'N/A') {
      const contactOut = {
        email: row['email'],
      };

      contacts.push(contactOut);
    }
  })
  .on('end', () => {
    console.log(contacts.length);
    // csvWriter
    //   .writeRecords(contacts)
    //   .then(() => console.log('The CSV file was written successfully'));
    console.log('CSV file successfully processed');
  });
