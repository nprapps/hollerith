var aws = require("aws-sdk");

var s3 = new aws.S3();

var upload = function (bucket, path, buffer) {
  return new Promise((ok, fail) => {
    if (typeof buffer == "string") {
      buffer = Buffer.from(buffer);
    }
    //normalize addresses for Windows
    path = path.replace(/\\/g, "/");
    var obj = {
      Bucket: bucket,
      Key: path,
      Body: buffer,
      ACL: "public-read",
      ContentType: "application/json",
      CacheControl: "public,max-age=30"
    };
    s3.putObject(obj, function (err) {
      if (err) return fail(err);
      console.log(
        `Uploaded ${(buffer.length / 1024) | 0}KB to s3://${bucket}/${path}`
      );
      ok(path);
    });
  });
};

module.exports = { upload };
