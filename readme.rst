Herman Hollerith developed the punch cards used to tabulate the 1890 census, reducing the processing time by two years. His Tabulating Machine Company was later merged with four other firms to form IBM and kickstart the modern information age.

This project allows users to deploy Google Sheets to a JSON file on Amazon S3 from an add-on menu, by leveraging an AWS Lambda function to perform the transfer. The data can then be loaded asynchronously by visualizations or data graphics, allowing updates without requiring a News Apps team member to redeploy the entire graphic.

To set up Hollerith for the first time at your organization, read "`Setting up Hollerith <#setting-up-hollerith>`_." If you're at NPR, Hollerith has already been set up, so you can skip to "`Adding Hollerith to a spreadsheet at NPR <#adding-hollerith-to-a-spreadsheet-at-npr>`_."

Setting up Hollerith
====================

Unfortunately, configuring this process requires several moving parts, given the multiple services that are interacting. We'll need to set up authentication for Google, deploy and configure our Lambda function, and finally load the add-on into our workbook for end-users.

Google authentication
---------------------

In order to authenticate against Google's APIs in a stateless way, we need to provide our Lambda with the keys for a JWT auth flow. 

1. Visit the Google API developer console and `set up a Service Account <https://console.developers.google.com/iam-admin/serviceaccounts>`_ for your organization. Use the menu to create keys and download the resulting JSON to your computer. Any files that you want to be able to publish will need to be shared with this account e-mail--the easiest way to do that is often to share the root Drive folder with the account, so that new documents in that Drive will be accessible.
2. From that file, extract the ``client_email`` and ``private_key`` fields. You'll want to set these up as environment variables (locally for testing, or in the Lambda configuration later) named ``GOOGLE_JWT_EMAIL`` and ``GOOGLE_JWT_KEY``, respectively.
3. If the keys are good and the script can see the environment variables, you should be able to perform a test run locally via ``node index.js --sheet="SHEET_ID" --slug="TEST_SLUG"``. It may still fail on the S3 publish if you don't have those access IDs set up already.

Lambda setup
------------

1. Create a Lambda function and upload the files from this project--``index.js``, ``s3.js``, and ``sheets.js``. The function should be assigned a role that grants it write permissions to your S3 bucket, as well as the "AWSLambdaBasicExecutionRole" policy for logging.
2. Add the ``GOOGLE_JWT_EMAIL`` and ``GOOGLE_JWT_KEY`` environment variables to the function configuration.
3. Since the AWS SDK is already installed for functions, we only need to add the Google API package. Doing this as a "layer" means that we can also reuse it for other Lambda code.

   a) Create a local directory containing a ``nodejs`` folder.
   b) Inside that folder, run ``npm init -y`` to create a package manifest.
   c) Install the Google API package with ``npm i googleapis``.
   d) Zip up the outer folder, so that the resulting archive contains ``nodejs/node_modules/*``.
   e) Upload the Layer package to S3, and add it to your Lambda function configuration.

4. At this point, you should be able to test-fire the function and pass in a fake request event with "sheet" and "slug" query params, and see it correctly fetch/publish.
5. Create an API Gateway endpoint using the simple HTTP option. Route traffic from this to the Lambda function. Verify that you can visit this endpoint and trigger a test publish.

Configuring the add-on
----------------------

The code for the add-on is checked into this repo.

1. In the sheet you want to enable for publication, open the script editor. Paste in the add-on code.
2. Update the ``LAMBDA_ENDPOINT`` with your API Gateway URL.
3. Click "Run" to enable the add-on for all users of the spreadsheet. Proceed to "`Using the add-on <#using-the-add-on>`_."

Adding Hollerith to a spreadsheet at NPR
========================================

Hollerith has been configured for use with the dailygraphics-next rig. There are just a few steps to add it to a new speadsheet.

1. Share the spreadsheet with the appropriate service account. This happens automatically if spreadsheet is in the dailygraphics folder in Google Drive. If it's not, ask a News Apps team member for the email address of the service account.

2. Add the script to your spreadsheet by clicking "Extensions" > "Apps Script." You can copy `the script from this repo <https://github.com/nprapps/hollerith/blob/master/add-on.gs>`_ or copy it from an existing project. If you do the former, get the LAMBDA_ENDPOINT from a team member and put it on Line 2. When you paste the script into the editor, replace the wrapper function that shows up by default.

3. Save your project, giving it a name of your choice. Click "Run." 

4. You'll get a message saying "Authorization required: This project requires your permission to access your data." Click "Review permissions" and select your NPR Google account. You'll get another message, saying "<Name of project> wants to access your Google Account." Click "Allow."

The add-on has been set up! Proceed to "`Using the add-on <#using-the-add-on>`_."

Using the add-on
================

1. A new menu item will have appeared on your spreadsheet, called "Deploy data." Click "Deploy data" > "Set slug". You'll get a popup that says "Set the slug for the deployment JSON (should match the dailygraphics slug)." Enter the slug, which will become the name of the JSON file on S3. Click "OK." This step only needs to be done once per spreadsheet.

2. You can now deploy your data by clicking "Deploy data" > "Deploy." If the deployment is successful, the URL of the outputted JSON file on S3. If you're at NPR, the URL will be ``https://apps.npr.org/dailygraphics/data/sheets/GRAPHIC_SLUG.json``. 

3. Others in your organization can now use the add-on to deploy data, too. The first time they do so, they will need to give the script permission to access to their Google Account. But they should not reset the slug.

The output file will effectively be the complete contents of the workbook, similar to the ``COPY`` object in the dailygraphics rig. Sheets with a "key" column will be exported as a lookup object instead of an array. Sheets or columns prefixed with an underscore (i.e., ``_coverpage``) will be skipped.

Since Lambda functions are limited to three seconds of execution time, any workbooks being deployed this way should be reasonably sized. Use the underscore prefix to hide large source data and generate subsets for actual publication if you find yourself running over the limit.

For safety's sake, the serverless function is currently configured to only publish sheets that are owned by an ``npr.org`` e-mail address.
