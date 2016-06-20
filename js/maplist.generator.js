// Helper Node.js script to regenerate map list
var fs = require('fs');
regenerateMaps('../resources/maps/', '../js/maplist.js');

function regenerateMaps(path, mapListFile) {
  var maps = [], fileContents;
  try {
    fs.readdirSync(path).forEach(function(fileName) {
      if (/\.map/.test(fileName)) {
        maps.push({
          name: fileName,
          data: fs.readFileSync(path + fileName, 'utf-8')
        });
      }
    });

    fileContents = 'export default ' + JSON.stringify(maps, null, '\t') + ';';
    fs.writeFileSync(mapListFile, fileContents);
    console.log('Map list generated to file: ', mapListFile);
  } catch(e) {
    console.log('Failed to regenerate maps!', e.toString());
  }
}