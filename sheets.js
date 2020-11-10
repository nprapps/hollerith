var { google } = require("googleapis");

var sheetsAPI = google.sheets("v4");
var driveAPI = google.drive("v3");

var getClient = async function () {
  var email = process.env.GOOGLE_JWT_EMAIL;
  var key = process.env.GOOGLE_JWT_KEY;
  key = key.replace(/\\n/g, "\n");
  var scopes = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets"
  ];
  var auth = new google.auth.JWT({ email, key, scopes });
  await auth.authorize();
  return auth;
};

var getMetadata = async function (fileId) {
  var auth = await getClient();
  var meta = await driveAPI.files.get({ auth, fileId, fields: "*" });
  return meta.data;
};

var cast = function (str) {
  if (typeof str !== "string") {
    if (typeof str.value == "string") {
      str = str.value;
    } else {
      return str;
    }
  }
  if (str.match(/^(-?(0?\.0*)?[1-9][\d\.,]*|0)$/)) {
    //number, excluding those with leading zeros (could be ZIP codes or octal)
    var n = Number(str.replace(/,/g, ""));
    if (!isNaN(n)) return n;
    return str;
  }
  if (str.toLowerCase() == "true" || str.toLowerCase() == "false") {
    return str.toLowerCase() == "true" ? true : false;
  }
  return str;
};

var getSheet = async function (spreadsheetId) {
  var auth = await getClient();

  var COPY = {};

  var book = (await sheetsAPI.spreadsheets.get({ auth, spreadsheetId })).data;
  var { sheets, spreadsheetId } = book;
  var ranges = sheets
    .map((s) => `${s.properties.title}!A:AAA`)
    .filter((s) => s[0] != "_"); // filter out sheets prefixed with _
  var response = await sheetsAPI.spreadsheets.values.batchGet({
    auth,
    spreadsheetId,
    ranges,
    majorDimension: "ROWS"
  });
  var { valueRanges } = response.data;
  for (var sheet of valueRanges) {
    var { values, range } = sheet;
    if (!values) continue;
    values = values.filter((v) => v.length);
    var [title] = range.split("!");
    var header = values.shift();
    var isKeyed = header.indexOf("key") > -1;
    var isValued = header.indexOf("value") > -1;
    var out = isKeyed ? {} : [];
    for (var row of values) {
      var obj = {};
      row.forEach(function (value, i) {
        var key = header[i];
        obj[key] = cast(value);
      });
      if (isKeyed) {
        out[obj.key] = isValued ? obj.value : obj;
      } else {
        out.push(obj);
      }
    }
    COPY[title] = out;
  }

  return COPY;
};

module.exports = { getSheet, getMetadata };
