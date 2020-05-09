const fs = require("fs");
const async = require("async");

function uploadImages(drive, folderId, dirPath, files, concurrency, nextStep) {
    const q = async.queue((file, next) => {
        let fileName = "________DEFAULT_________";
        try {
            fileName = file.slice(0, -4);
        } catch (e) {
            console.log("Error", e);
            console.log("Couldn't Slice this piece of shit", file);
        }
        const fileMetadata = {
            name: `${file.slice(0, -4)}.docx`,
            parents: [folderId],
            mimeType: "application/vnd.google-apps.document"
        };
        const media = {
            mimeType: "application/vnd.google-apps.document",
            body: fs.createReadStream(`${dirPath}/${file}`)
        };
        drive.files.create(
            {
                resource: fileMetadata,
                media: media,
                fields: "id"
            },
            function(err, newFile) {
                if (err) {
                    // Handle error
                    q.push(file, err => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(`${fileName} has been added to end of queue.`);
                        }
                    });
                } else {
                    console.log("Uploaded: ", fileName);
                }
                next();
            }
        );
    }, concurrency);
    files.forEach(file => q.push(file, err => (err ? console.log(err) : null)));
    q.drain(nextStep);
}
module.exports = { uploadImages };

// async.eachSeries(ids, (file, next) => {
//     const fileName = file.slice(0, -4);
//     const fileMetadata = {
//         name: `${file.slice(0, -4)}.docx`,
//         parents: [folderId],
//         mimeType: "application/vnd.google-apps.document"
//     };
//     const media = {
//         mimeType: "application/vnd.google-apps.document",
//         body: fs.createReadStream(`${dirPath}/${file}`)
//     };
//     drive.files.create(
//         {
//             resource: fileMetadata,
//             media: media,
//             fields: "id"
//         },
//         function(err, file) {
//             if (err) {
//                 // Handle error
//                 ids.push(file);
//                 console.log(`${fileName} has been added to end of queue.`);
//                 counter++;
//                 next();
//             } else {
//                 console.log("Uploaded: ", fileName);
//                 if (counter === ids.length - 1) {
//                     nextStep();
//                 } else {
//                     counter++;
//                     next();
//                 }
//             }
//         }
//     );
// });
