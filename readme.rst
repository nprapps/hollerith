Herman Hollerith developed the punch cards used to tabulate the 1890 census, reducing the processing time by two years. His Tabulating Machine Company was later merged with four other firms to form IBM and kickstart the modern information age.

This project allows users to deploy Google Sheets to a JSON file on Amazon S3 from an add-on menu, by leveraging an AWS Lambda function to perform the transfer. The data can then be loaded asynchronously by visualizations or data graphics, allowing updates without requiring a News Apps team member to redeploy the entire graphic.

In Use
======

When configured for a spreadsheet, using Hollerith is simple:

1. From the Hollerith item in the add-ons menu, choose "Deploy"
2. If you have not set the slug for the exported data file, it will ask you to do so.
3. An alert should let you know if the export was successful or not. If it was, it will provide the URL for the output file on S3.

The output file will effectively be the complete contents of the workbook, similar to the ``COPY`` object in the dailygraphics rig. Sheets with a "key" column will be exported as a lookup object instead of an array. Sheets or columns prefixed with an underscore (i.e., ``_coverpage``) will be skipped.

Since Lambda functions are limited to three seconds of execution time, any workbooks being deployed this way should be reasonably sized. Use the underscore prefix to hide large source data and generate subsets for actual publication if you find yourself running over the limit.

For safety's sake, the serverless function is currently configured to only publish sheets that are owned by an ``npr.org`` e-mail address.

Setup
=====

Unfortunately, configuring this process requires several moving parts, given the multiple services that are interacting. We'll need to set up authentication for Google, deploy and configure our Lambda function, and finally load the add-on into our workbook for end-users.

Google authentication
---------------------

In order to authenticate against Google's APIs in a stateless way, we need to provide our Lambda with the keys for a JWT auth flow. 

1. Visit the Google API developer console and `set up a Service Account <https://console.developers.google.com/iam-admin/serviceaccounts>`_ for your organization. Use the menu to create keys and download the resulting JSON to your computer.
2. From that file, extract the ``client_email`` and ``private_key`` fields. You'll want to set these up as environment variables (locally for testing, or in the Lambda configuration later) named ``GOOGLE_JWT_EMAIL`` and ``GOOGLE_JWT_KEY``, respectively.

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

Add-on config
-------------

The code for the add-on is checked into this repo.

1. In the sheet you want to enable for publication, open the script editor. Paste in the add-on code.
2. Update the ``LAMBDA_ENDPOINT`` with your API Gateway URL.
3. Choose "Test as add-on" from the Run menu and enable it for all users.
4. Configure the slug from the "Deploy data" menu.

