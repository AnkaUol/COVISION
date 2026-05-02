/* CREATE DIFFERENT VERSIONS OF THE WORDLIST MEMORY TEST FOR SOSCI SURVEY

Has to be adapted:
1 filePath: path where the relevant files are stored; "" if the same as the script
2 zipFile: the zip file that is used as template for the memory tests
3 csvFile: name of the file with the different wordlists
4 csvTemplate: name of the template for the csv file from the zipFile; this may change when you export a new sosci integration from labjs, so you always have to go to the new zip file and check for the name of the csv under /embedded
*/

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const csv = require("csv-parser");
//const { parse } = require("csv-parse");

const filePath = "";
const zipFile = "covision_memory_cont_audios-export.zip";
const del = ";";
const csvFile = "COVISION_memory_wordlists.csv";
const csvTemplate =
  "embedded/b1fee598df13c543b40f701a60a19c90e31d94462d8dabfd963cae658c473e6b.csv";


// 1. EXTRACT ZIP --------------------------------------------
// Prüfen, ob die Datei existiert
if (!fs.existsSync(filePath + zipFile)) {
  throw new Error(`Die Datei ${filePath + zipFile} existiert nicht.`);
}

// Ordner erstellen, falls nicht existiert
const extractDir = path.join(filePath, "extracted");
if (!fs.existsSync(extractDir)) {
  fs.mkdirSync(extractDir);
}

// Zip-Datei entpacken
const zip = new AdmZip(filePath + zipFile);
zip.extractAllTo(extractDir, true);

// 2. READ CSV, SPLIT INTO ROWS AND SAVE NEW ZIP FILES ----------------------------------------------

// Prüfen, ob die Datei existiert
if (!fs.existsSync(filePath + csvFile)) {
  throw new Error(`Die Datei ${filePath + csvFile} existiert nicht.`);
}

// Ordner erstellen, falls nicht existiert
const outputDir = path.join(
  filePath,
  `${path.basename(zipFile, ".zip")}_versions`
); // add name of original file
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Create path to csv template

const targetFileFullPath = path.join(extractDir, csvTemplate);

let rowIndex = 0;
fs.createReadStream(filePath + csvFile)
  .pipe(csv({ separator: ";" }))
  .on("data", (row) => {
    const newCsvContent = `${Object.keys(row).join(del)}\n${Object.values(
      row
    ).join(del)}`;

    // Schreibe den neuen CSV-Inhalt zur Zieldatei in der entpackten Struktur
    fs.writeFileSync(targetFileFullPath, newCsvContent);

    // Packe die ZIP-Datei neu mit der aktualisierten Datei

    const newZip = new AdmZip();

    fs.readdirSync(extractDir).forEach((file) => {
      const fullPath = path.join(extractDir, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        newZip.addLocalFolder(fullPath, file);
      } else {
        newZip.addLocalFile(fullPath);
      }
    });

    // Neue Version der Zip-Datei erstellen
    const newZipFileName = `${path.basename(
      zipFile,
      ".zip"
    )}_version_${rowIndex}.zip`; // rowIndex+1 if you want the first file to be 0
    const newZipFilePath = path.join(outputDir, newZipFileName);

    newZip.writeZip(newZipFilePath);

    console.log(`Erstellte neue Zip-Datei: ${newZipFileName}`);

    rowIndex++;

    // delete extracted file
  })
  .on("end", () => {
    // Entfernen Sie das temporäre entpackte Verzeichnis
    fs.rmSync(extractDir, { recursive: true, force: true });
  });
