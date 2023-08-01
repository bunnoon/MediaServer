const { existsSync, readFile, stat } = require("fs");
const { join } = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

app.use(bodyParser.json());
app.use(cookieParser("!!! SECRET_KEY !!!"));
app.use(
  cors({
    origin: "*",
    preflightContinue: true,
  })
);

app.get("/playback/:source", (req, res) => {
  const sourceFile = req.params.source;
  const sourceType = sourceFile.split(".").pop();
  const sourcePath = join(__dirname, `videos/1/${sourceFile}`);

  console.log(
    `\nFile: ${sourceFile}\nType: ${sourceType}\nPath: ${sourcePath}`
  );

  if (existsSync(sourcePath)) {
    readFile(sourcePath, (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal error at mpd logic");
        return;
      }

      if (sourceType === "mpd") {
        res.writeHead(200, {
          "Content-Type": "application/dash+xml",
          Connection: "keep-alive",
        });
        res.write(data);
        res.end();
      }

      if (sourceType === "m4s") {
        stat(sourcePath, (err, stats) => {
          if (err) {
            console.error(err);
            res.status(500).send("Internal error at m4s logic");
            return;
          }

          if (stats.isFile()) {
            res.writeHead(200, {
              "Content-Type": "video/mp4",
              "Content-Length": stats.size,
              Connection: "keep-alive",
            });
            res.write(data);
            res.end();
          } else {
            res.end();
          }
        });
      }
    });

    return;
  }

  res.status(404).send("Content not found!");
});

app.listen(8080, () => {
  console.log("Node Express server running in http://localhost:8080");
});
