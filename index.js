const express = require("express");
const bodyParser = require("body-parser");
const PORT = 1025;

let counter = 0;
const messages = [];

const app = express();

const HTML_ENTITY_LOOKUP = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
};

function htmlentities(text) {
  return text.replace(/[<>&"]/g, (char) => HTML_ENTITY_LOOKUP[char]);
}

app.use(bodyParser.urlencoded());

app.post("/", (request, response) => {
  console.log(request.body);
  messages.push(request.body.message);
  response.setHeader("Location", "/");
  response.statusCode = 301;
  response.end();
});
app.get("/", (request, response) => {
  counter++;
  response.setHeader("Content-Type", "text/html");
  response.end(`
<!DOCTYPE html>
<html>
<head>
<title>Demo server</title>
</head>
<body>
Request counter: ${counter}<br />
Path: ${request.url}<br />
<h1>Messages</h1>
<ul>
  ${messages.map((msg) => `<li>${htmlentities(msg)}</li>`).join("\n  ")}
</ul>
<h3>Add message</h3>
<form method="POST">
  <textarea name="message"></textarea><br />
  <button type="submit">Send</button>
</form>
</body>
</html>
  `);
});

app.use((request, response) => {
  response.statusCode = 404;
  response.end("File Not Found");
});

app.listen(PORT);
console.log(`Server running at http://localhost:${PORT}/`);
