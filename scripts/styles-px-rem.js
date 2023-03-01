const fs = require('fs');
const path = require('path');

const edit = filePath => {
  const oldContent = fs.readFileSync(filePath, { encoding: 'utf8' });
  const newContentArray = oldContent.split(' ');
  newContentArray.forEach((word, index) => {
    if (word.includes('px')) {
      const num = parseInt(word.replace(/\D/g, ''));
      if (!isNaN(num)) {
        console.log(num);

        newContentArray[index] = word.replace(`${num}px`, `${num / 16}rem`);
      }
    }
  });
  const newContent = newContentArray.join(' ');
  fs.writeFileSync(filePath, newContent, { encoding: 'utf-8' });
  console.log(`Edited file: ${filePath}`);
};

const main = () => {
  const dir =
    '/Users/peyhobso/Personal-Projects/Caregiver-Marketplace/src/styles/marketplaceDefaults1.css';
  edit(dir);
};

main();
