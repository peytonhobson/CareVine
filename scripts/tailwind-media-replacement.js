const fs = require('fs');
const path = require('path');
const walk = dir => {
  try {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        // Recurse into subdir
        results = [...results, ...walk(file)];
      } else {
        // Is a file
        results.push(file);
      }
    });
    return results;
  } catch (error) {
    console.error(`Error when walking dir ${dir}`, error);
  }
};
const edit = filePath => {
  const oldContent = fs.readFileSync(filePath, { encoding: 'utf8' });
  const newContent = oldContent
    .replaceAll('@media (--viewportLarge)', '@media screen(lg)')
    .replaceAll('@media (--viewportMedium)', '@media screen(md)')
    .replaceAll('@media (--viewportSmall)', '@media screen(sm)')
    .replaceAll('@media (--viewportXLarge)', '@media screen(xl)')
    .replaceAll('@media (--viewportLargeWithPadding)', '@media screen(lgwp)');
  fs.writeFileSync(filePath, newContent, { encoding: 'utf-8' });
  console.log(`Edited file: ${filePath}`);
};
const main = () => {
  const dir = '/Users/peyhobso/CareVine/src';
  const filePaths = walk(dir);
  filePaths.forEach(filePath => edit(filePath));
};
main();
