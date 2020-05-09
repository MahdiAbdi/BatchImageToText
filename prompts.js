const questions = [
    {
        type: "confirm",
        name: "driveApiEnabled",
        message: "Have you enable tour Google Drive API from developer console?",
        initial: true
    },
    {
        type: "text",
        name: "bookName",
        message: "Whats the name of your book?"
    },
    {
        type: "text",
        name: "dirPath",
        message: "Where are your files located? (Relative path)"
    },
    {
        type: "confirm",
        name: "removeFilesAfterCompletetion",
        message:
            "Do you want your doc files to be removed from Google drive after the process finished successfully?",
            initial: true
    }
];

const onSubmit = (prompt, answer, answers) => {
    if (!answers.driveApiEnabled) {
        console.log(
            "Drive API must be enabled. Read the instructions at:\nhttps://developers.google.com/drive/api/v3/enable-drive-api"
        );
        return true;
    }
};

const onCancel = (prompt, answers) => false;

module.exports = { questions, onSubmit, onCancel };
