const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

const persianToEnglishNumber = number => {
    let newNumber = number;
    persianNumbers.forEach((n, index) => {
        newNumber = replaceAll(newNumber, n, index);
    });
    return Number(newNumber);
};

const getNumberLength = number => String(number).length;
const fixNumberLength = (number, length) =>
    `${"0".repeat(length - getNumberLength(number))}${number}`;

function getImages(config) {
    const { pageQuery, totalPagesId, totalPagesSlice, nextButtonId, ms } = config;

    let pageNo = 1;
    const interval = setInterval(() => {
        const a = document.createElement("a");
        const page = pageQuery(pageNo);
        const totalPages = persianToEnglishNumber(
            document.querySelector(totalPagesId).innerHTML.slice(totalPagesSlice)
        );
        const next = document.querySelector(nextButtonId);
        a.href = page.toDataURL("image/png");
        a.download = `${fixNumberLength(pageNo, getNumberLength(totalPages))} - ${+new Date()}.png`;
        a.target = "_blank";
        a.click();
        pageNo++;
        next.click();
    }, ms);
}

// Fidibo / Taaghche
const fidicheConfig = {
    pageQuery: () => document.querySelector("#canvas0"),
    totalPagesId: "#totalPages",
    totalPagesSlice: 0,
    nextButtonId: "#___nextPage",
    ms: 1000
};

// PDF
const pdfConfig = {
    pageQuery: pageNo =>
        document.querySelector(
            `div.page:nth-child(${pageNo}) > div:nth-child(1) > canvas:nth-child(1)`
        ),
    totalPagesId: "#numPages",
    totalPagesSlice: 3,
    nextButtonId: "#next",
    ms: 100
};

const getFromFidiChe = () => getImages(fidicheConfig);
const getFromPDF = () => getImages(pdfConfig);
