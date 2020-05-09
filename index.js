const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { downloadBook } = require("./downloadBook");
const { uploadImages } = require("./uploadImages");
const async = require("async");
const prompts = require("prompts");
const { questions, onSubmit, onCancel } = require("./prompts");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), main);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
    });
    console.log("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question("Enter the code from that page here: ", code => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error("Error retrieving access token", err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
                if (err) return console.error(err);
                console.log("Token stored to", TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function main(auth) {
    const drive = google.drive({ version: "v3", auth });
    (async () => {
        const responses = await prompts(questions, {
            onCancel,
            onSubmit
        });
        if (!responses.driveApiEnabled) {
            return;
        }
        let ready = true;
        questions.forEach(question => {
            if (responses[question.name] === "") {
                console.log(`You must enter ${question.name}.`);
                ready = false;
            }
        });
        if (!ready) return;

        const { bookName, dirPath, folderId, removeFilesAfterCompletetion } = responses;
        const concurrentUploads = 10;
        const appDirName = "__batch-image-to-text__";

        drive.files.list(
            {
                q: `mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and name = '${appDirName}' and trashed = false`,
                fields: "files(id, name, trashed)"
            },
            (err, res) => {
                if (err) {
                    console.log("Couldn't fetch drive files list", err);
                } else {
                    const folder = res.data.files[0];
                    let appFolderId = "";
                    if (folder) {
                        appFolderId = folder.id;
                    } else {
                        drive.files.create(
                            {
                                resource: {
                                    name: appDirName,
                                    mimeType: "application/vnd.google-apps.folder"
                                },
                                fields: "id"
                            },
                            (err, appFolder) => {
                                if (err) {
                                    // Handle error creating app directory
                                    console.error("Error in creating app directory", err);
                                } else {
                                    appFolderId = appFolder.data.id;
                                }
                            }
                        );
                    }
                    drive.files.create(
                        {
                            resource: {
                                name: bookName,
                                mimeType: "application/vnd.google-apps.folder",
                                parents: [appFolderId]
                            },
                            fields: "id"
                        },
                        function(err, bookFolder) {
                            if (err) {
                                // Handle error creating book directory
                                console.error("Error in creating book directory", err);
                            } else {
                                const bookFolderId = bookFolder.data.id;
                                console.log("Book folder Id: ", bookFolderId);
                                fs.readdir(dirPath, (err, files) => {
                                    async.eachSeries(
                                        [
                                            next =>
                                                uploadImages(
                                                    drive,
                                                    bookFolderId,
                                                    dirPath,
                                                    files,
                                                    concurrentUploads,
                                                    next
                                                ),
                                            next =>
                                                downloadBook(
                                                    drive,
                                                    bookFolderId,
                                                    bookName,
                                                    files.length,
                                                    next
                                                ),
                                            next =>
                                                removeFilesAfterCompletetion
                                                    ? removeFiles(drive, bookFolderId, next)
                                                    : next()
                                        ],
                                        (func, next) => func(next)
                                    );
                                });
                            }
                        }
                    );
                }
            }
        );
    })();
}

const removeFiles = (drive, bookFolderId, nextStep) =>
    drive.files.delete(
        {
            fileId: bookFolderId
        },
        (err, deletedFile) => {
            if (err) {
                console.log("Couldn't remove book folder", err);
            } else {
                console.log("Book files has been deleted successfully from your Google Drive.");
                nextStep();
            }
        }
    );

//  Add NextStep to DownloadBook and Add Queue
//  Add an extra step to index and remove files from drive. (Optional)
//  Remove Redundant Questions.
