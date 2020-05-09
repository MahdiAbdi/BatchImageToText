const fs = require("fs");
const async = require("async");

function downloadBook(drive, parentId, bookName, numberOfFiles, nextStep) {
    const outputFile = `output/${bookName}.txt`;
    fs.writeFileSync(outputFile, "");
    drive.files.list(
        {
            q: `'${parentId}' in parents and trashed = false`,
            pageSize: numberOfFiles,
            fields: "files(id, name, trashed)",
            orderBy: "name"
        },
        (err, res) => {
            const files = res.data.files;
            const q = async.queue((file, next) => {
                drive.files
                    .export({
                        fileId: file.id,
                        mimeType: "text/plain"
                    })
                    .then(res => {
                        const text = res.data.replace("﻿________________\r\n\r\n", "");
                        fs.appendFileSync(outputFile, text);
                        console.log(`${file.name} has been written to book.`);
                        next();
                    })
                    .catch(err => console.log(`Error in File with ID: ${file.id}`));
            });
            files.forEach(file => q.push(file, err => (err ? console.log(err) : null)));
            q.drain(nextStep);
        }
    );
}

module.exports = { downloadBook };
