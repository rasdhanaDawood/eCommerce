require("dotenv").config();
const express = require("express");
const db = require("./utils/db");
const app = new express();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const sass = require("sass");
const fs = require("fs");
const session = require("express-session");
const flash = require("connect-flash");
const config = require("./config/config");
const nocache = require("nocache");

app.use(
  session({
    secret: config.sessionSecret,
    saveUninitialized: false,
    resave: false,
  })
);

db();

const compileSass = (srcPath, destPath) => {
  const result = sass.renderSync({
    file: srcPath,
    outputStyle: "compressed",
  });
  fs.writeFileSync(destPath, result.css);
};

const sassMiddleware = (req, res, next) => {
  const srcPath = path.join(__dirname, "public/scss", "style.scss");
  const destPath = path.join(__dirname, "public/css", "style.css");

  if (fs.existsSync(srcPath)) {
    compileSass(srcPath, destPath);
  }

  next();
};

app.use(sassMiddleware);

app.use(flash());
app.use(nocache());
app.use(logger("dev"));

app.use(express.json());
app.use(cookieParser());

app.use(
  express.static("public", {
    setHeaders: (res, path, stat) => {
      if (path.endsWith(".js")) {
        res.set("Content-Type", "application/javascript");
      }
    },
  })
);

app.use(express.urlencoded({ extended: true }));

app.use("/docs", express.static(path.join(__dirname, "docs")));
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

const productRoute = require("./routes/productRoute");
app.use("/", productRoute);

const IP = process.env.IP || "127.0.0.1";
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running at http://${IP}:${port}/login`);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  return res.render("error", {
    message: res.locals.message,
  });
});

module.exports = app;
