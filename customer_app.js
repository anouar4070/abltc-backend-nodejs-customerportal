// Importing necessary libraries and modules
const mongoose = require("mongoose"); // MongoDB ODM library
const Customers = require("./customer"); // Imported MongoDB model for 'customers'
const express = require("express"); // Express.js web framework
const bodyParser = require("body-parser"); // Middleware for parsing JSON requests
const path = require("path"); // Node.js path module for working with file and directory paths

const {
  ValidationError,
  InvalidUserError,
  AuthenticationFailed,
  NameValidationError,
} = require("./errors/CustomError");

// Creating an instance of the Express application
const app = express();

// Setting the port number for the server
const port = 3000;

// MongoDB connection URI and database name
const uri = "mongodb://127.0.0.1:27017";
mongoose.connect(uri, { dbName: "customerDB" });

// Middleware to parse JSON requests
app.use("*", bodyParser.json());

// Serving static files from the 'frontend' directory under the '/static' route
app.use("/static", express.static(path.join(".", "frontend")));

// Middleware to handle URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));

// POST endpoint for user login
// POST endpoint for user login
app.post("/api/login", async (req, res, next) => {
  const data = req.body;
  const user_name = data["user_name"];
  const password = data["password"];

  try {
    const user = await Customers.findOne({ user_name: user_name });
    if (!user) {
      throw new InvalidUserError("No such user in database");
    }
    if (user.password !== password) {
      throw new AuthenticationFailed("Passwords don't match");
    }
    res.send("User Logged In");
  } catch (error) {
    next(error);
  }
});

// POST endpoint for adding a new customer
// POST endpoint for adding a new customer
app.post("/api/add_customer", async (req, res, next) => {
  const data = req.body;
  const age = parseInt(data["age"]);

  try {
    if (typeof data['name'] !== 'string' || !data['name'].trim()) {
        throw new NameValidationError("Name must be a non-empty string.");
    }

    if (age < 21) {
      throw new ValidationError("Customer Under required age limit");
    }

    const customer = new Customers({
      user_name: data["user_name"],
      age: age,
      password: data["password"],
      email: data["email"],
    });

    await customer.save();

    res.send("Customer added successfully");
  } catch (error) {
    next(error);
  }
});

// GET endpoint for user logout
app.get("/api/logout", async (req, res) => {
  res.cookie("username", "", { expires: new Date(0) });
  res.redirect("/");
});

// GET endpoint for the root URL, serving the home page
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "home.html"));
});

// Catch-all (middleware for undefined routes)
app.all("*", (req, res, next) => {
  const err = new Error(
    `Cannot find the URL ${req.originalUrl} in this application. Please check.`
  );
  err.status = "Endpoint Failure";
  err.statusCode = 404;
  next(err); // Pass the error to the error-handling middleware
});

//You should add the error-handling middleware after all your route definitions but before starting the server (app.listen).
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "Error";
  console.log(err.stack);
  res.status(err.statusCode).json({
    status: err.statusCode,
    message: err.message,
  });
});

// Starting the server and listening on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://127.0.0.1:${port}`);
});
