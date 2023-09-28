function milliToDate(milliseconds) {
    return new Date(milliseconds).toISOString().slice(0, 10)
}

function milliToHHMMSS(milliseconds) {
    return new Date(milliseconds).toISOString().slice(11, 19)
}

function milliToBrazilLocale(milliseconds) {
    return new Date(milliseconds).toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }).slice(11, 19);
}