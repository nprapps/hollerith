// Copy this into your sheet's script editor and use "Test as add-on" to enable
const LAMBDA_ENDPOINT = ""; // update this to match your API Gateway

var ui = SpreadsheetApp.getUi();

function onOpen() {
  var menu = ui.createMenu("Deploy data");
  menu.addItem("Set Slug", "configureSlug");
  menu.addItem("Deploy", "deployData");
  menu.addToUi();
}

function configureSlug() {
  var props = PropertiesService.getDocumentProperties();
  var slug = ui.prompt("Set the slug for the deployment JSON (should match the dailygraphics slug");
  slug = slug.getResponseText();
  props.setProperty("slug", slug);
  return slug;
}

function deployData() {
  var props = PropertiesService.getDocumentProperties();
  var slug = props.getProperty("slug");
  if (!slug) {
    slug = configureSlug();
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getId();
  var endpoint = `${LAMBDA_ENDPOINT}?sheet=${sheet}&slug=${slug}`;
  var response = UrlFetchApp.fetch(endpoint).getContentText();
  var result = JSON.parse(response);
  if (result.error || result.message) {
    ui.alert("Error: " + result.error || result.message);
  }
  if (result.href) {
    ui.alert("Success: " + result.href);
  }
}
