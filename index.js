var { getMetadata, getSheet } = require("./sheets");
var { upload } = require("./s3");
var fs = require("fs").promises;

// actually do the work
var punch = async function (workbook, slug) {
  console.log(`Pulling sheet: ${workbook}`);
  // check metadata -- only republish NPR sheets
  try {
    var meta = await getMetadata(workbook);
  } catch (err) {
    return {
      error:
        "Unable to access this sheet - is it shared with the service account?"
    };
  }
  if (!meta.owners.some((owner) => owner.emailAddress.match(/@npr.org$/))) {
    return { error: "This sheet is not owned by an NPR user." };
  }
  // get sheet from request input
  var data = await getSheet(workbook);
  // upload to S3
  var json = JSON.stringify(data, null, 2);
  await upload("apps.npr.org", `dailygraphics/data/sheets/${slug}.json`, json);
  return {
    status: "success",
    href: `https://apps.npr.org/dailygraphics/data/sheets/${slug}.json`
  };
};

// run on Lambda
exports.handler = async function (event, context, callback) {
  var { sheet, slug } = event.queryStringParameters;
  var result = await punch(sheet, slug);
  return {
    statusCode: "error" in result ? 500 : 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(result)
  };
};

// run locally
var local = async function () {
  var minimist = require("minimist");
  var { sheet, slug } = minimist(process.argv);
  if (!sheet || !slug) {
    return console.log("Please provide a sheet and a slug.");
  }
  var result = await punch(sheet, slug);
  console.log(result);
};

if (!process.env.LAMBDA_TASK_ROOT) {
  local();
}
