/**
 * Name: Suhani Arora + Oscar Wang
 * Date: May 27, 2024
 * Section: CSE 154 AD
 * TAs: Max Beard + Allan N Tran
 *
 * This server-side JS deals with the backend logic for the books ecommerce website. It
 * offers several endpoints to retrieve and purchase products, deal with user accounts and
 * log users in and out.
 */
"use strict";

const express = require("express");
const app = express();

const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");

const multer = require("multer");
const path = require("path");

const crypto = require("crypto");
const cookieParser = require("cookie-parser");

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none()); // requires the "multer" module
app.use(cookieParser());

const INVALID_PARAM_ERROR = 400;
const UNAUTHORIZED_ERROR = 401;
const SERVER_ERROR = 500;
const SERVER_ERROR_MSG = "An error occurred on the server. Try again later.";
const MISSING_PARAMS_MSG = "Missing one or more of the required params.";
const ID_DNE_MSG = "The book ID does not exist.";
const LOCAL_PORT = 8000;
const EXPRESS_SHIPPING_COST = 6.99;
const TAX_RATE = 0.1;
const STANDARD_SHIPPING_COST = 0;
const EXPRESS_SHIPPING_DAYS = 2;
const STANDARD_SHIPPING_DAYS = 5;
const PAYMENT_METHOD = "credit card";
const PAYMENT_STATUS = "processing";
const ORDER_LIMIT = 1;
const SIXTY_FOUR = 64;
const SIXTEEN = 16;
const EIGHT = 8;

// 7 * 24 * 60 * 60 * 1000 = 604800000
const NUM_MS_IN_WEEK = 604800000;

/**
 * endpoint that gets information about a user
 */
app.get("/user-info", authenticate, (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(UNAUTHORIZED_ERROR).json({message: "Unauthorized"});
  }
});

/**
 * Endpoint that gets books based on a search query. Takes in a type of search
 * (such as author, title, genre) and filters the search results by the type. In the case where
 * no search results exist, sends back an empty JSON. If query params not provided, sends info on all books.
 * If a server error occurs, also sends back an error message indicating so.
 */
app.get("/get-books", async (req, res) => {
  try {
    let db = await getDBConnection();
    let queryResults;
    if (!req.query.search && !req.query.type) {
      const query =
        "SELECT book_id, title, author, price, genre, format, publisher, image " +
        "FROM Books ORDER BY title";
      queryResults = await db.all(query);
    } else if (req.query.search && req.query.type) {
      if (
        req.query.type !== "genre" &&
        req.query.type !== "author" &&
        req.query.type !== "title" &&
        req.query.type !== "all"
      ) {
        res.status(INVALID_PARAM_ERROR).type("text")
          .send("The type parameter has an invalid value.");
      } else {
        queryResults = await getBooksHelper(req, db);
      }
    } else {
      res.status(INVALID_PARAM_ERROR).type("text")
        .send(MISSING_PARAMS_MSG);
      await db.close();
      return;
    }
    res.json({books: queryResults});
    await db.close();
  } catch (err) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * endpoint that gets information on a book based on the provided book id. If a book id is not
 * provided, does not exist, or a server error occurs, sends back a message indicating so.
 */
app.get("/get-book/:bookid", async (req, res) => {
  try {
    if (!req.params.bookid) {
      res.status(INVALID_PARAM_ERROR)
        .type("text")
        .send(MISSING_PARAMS_MSG);
    } else {
      let db = await getDBConnection();
      const query = "SELECT * FROM Books WHERE book_id = ?";
      let queryResults = await db.get(query, [req.params.bookid]);
      if (!queryResults) {
        res.status(INVALID_PARAM_ERROR)
          .type("text")
          .send(ID_DNE_MSG);
      } else {
        res.json(queryResults);
      }
      await db.close();
    }
  } catch (err) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * endpoint that adds a review to a specified book. takes in a rating, review and book id regarding
 * the review and adds it permanently to the state of the book.
 */
app.post("/add-review", async (req, res) => {
  try {
    if (!req.body.rating || !req.body.review || !req.body.bookid) {
      res.status(INVALID_PARAM_ERROR)
        .type("text")
        .send(MISSING_PARAMS_MSG);
    } else {
      let db = await getDBConnection();
      const getUserIdQuery =
        "SELECT user_id, first_name, last_name FROM Users WHERE session_token = ?";
      let userInfo = await db.get(getUserIdQuery, [req.cookies.session_token]);
      const insertReviewQuery =
        "INSERT INTO Reviews (user_id, book_id, rating, review) VALUES (?, ?, ?, ?)";
      let insertReviewQueryResult = await db.run(insertReviewQuery, [
        userInfo.user_id,
        req.body.bookid,
        parseInt(req.body.rating),
        req.body.review
      ]);
      const getRatingInfo =
        "SELECT AVG(rating) as average, COUNT(rating) as count FROM Reviews WHERE book_id = ?";
      let ratingInfo = await db.get(getRatingInfo, [req.body.bookid]);
      populateBasicUserInfo(req, userInfo);
      userInfo.review_id = insertReviewQueryResult.lastID;
      userInfo.avgRating = ratingInfo.average;
      userInfo.ratingCount = ratingInfo.count;
      res.json(userInfo);
      await db.close();
    }
  } catch (err) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * endpoint that gets reviews for a specified book. takes in a rating, review and book id regarding
 * the review and sends back all reviews for it.
 */
app.get("/get-reviews/:bookid", async (req, res) => {
  try {
    if (!req.params.bookid) {
      res.status(INVALID_PARAM_ERROR)
        .type("text")
        .send(MISSING_PARAMS_MSG);
    } else {
      let db = await getDBConnection();

      const getReviewsQuery =
        "SELECT r.rating, r.review, r.user_id, u.user_id, u.last_name, r.review_id, " +
        "u.first_name, r.created_at, r.book_id " +
        "FROM Reviews as r, Users as u " +
        "WHERE r.user_id = u.user_id AND book_id = ? " +
        "ORDER BY r.created_at DESC";
      let reviews = await db.all(getReviewsQuery, [req.params.bookid]);
      const getAverageRating =
        "SELECT AVG(rating) as average FROM Reviews WHERE book_id = ?";
      let avgRating = await db.get(getAverageRating, [req.params.bookid]);
      res.json({reviews: reviews, avgRating: avgRating.average});
      await db.close();
    }
  } catch (err) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * endpoint that logs user into the website. takes in email and password in body and authenticates
 * user if they match. sets a session token for user w a one week expiry. sends back a message
 * indicating if login was successful or not, and does the same if server error occured.
 */
app.post("/login", async (req, res) => {
  try {
    let db = await getDBConnection();
    const {email, password} = req.body;
    let query = "SELECT user_id FROM Users WHERE email = ? AND password = ?";
    let user = await db.get(query, [email, password]);
    if (user) {
      let userId = user.user_id;
      let token = generateToken();
      query = "UPDATE Users SET session_token = ? WHERE user_id = ?";
      db.run(query, [token, userId]);

      // change the secure to true later when deployed
      res.cookie("session_token", token, {
        httpOnly: false,
        maxAge: NUM_MS_IN_WEEK
      });
      res.type("text").send("log in successfully: " + email);
    } else {
      res
        .status(INVALID_PARAM_ERROR)
        .type("text")
        .send("Account not registered");
    }
    await db.close();
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * endpoint that logs user out of the website. nulls out the session token for the logged in
 * user.
 */
app.post("/logout", async (req, res) => {
  res.type("text");
  try {
    if (!req.cookies.session_token) {
      res.status(INVALID_PARAM_ERROR)
        .type("text")
        .send("No user logged in.");
    } else {
      let db = await getDBConnection();
      const query =
        "UPDATE Users SET session_token = NULL WHERE session_token = ?";
      await db.run(query, [req.cookies.session_token]);
      res.clearCookie("session_token");
      res.send("Successfully logged out.");
      await db.close();
    }
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * endpoint that adds item to cart. takes in information about user, cart and book and sends
 * success message in case of success, and failure message otherwise.
 */
app.post("/cart/add", async (req, res) => {
  try {
    let db = await getDBConnection();
    let data = req.body;
    let userId = await getUserId(data, db);

    if (userId) {
      let cartId = await getCartId(userId, db);
      let bookId = req.body.bookId;
      await updateCartItems(cartId, bookId, db);
      await setCartCount(cartId, db);
      res.type("text").send("Add to cart successfully");
    } else {
      res
        .status(UNAUTHORIZED_ERROR)
        .type("text")
        .send("session expired please log in again");
    }
    await db.close();
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * endpoint that removes item from cart. takes in information about user, cart and book and sends
 * success message in case of success, and failure message otherwise.
 */
app.post("/cart/remove", async (req, res) => {
  try {
    let db = await getDBConnection();
    let data = req.body;
    let userId = await getUserId(data, db);

    if (userId) {
      // get the cart_id to insert a new row into the cart_items table
      let cartId = await getCartId(userId, db);
      let bookId = req.body.bookId;

      // update the information in cart
      await removeFromCartItems(cartId, bookId, db);
      await setCartCount(cartId, db);
      res.type("text").send("Remove from cart successfully");
    } else {
      res
        .status(UNAUTHORIZED_ERROR)
        .type("text")
        .send("session expired please log in again");
    }

    await db.close();
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * endpoint that gets items for cart. takes in information about user to get cart of and sends
 * that information back in a json. responds with failure message in case of failure.
 */
app.get("/cart", async (req, res) => {
  try {
    let db = await getDBConnection();
    let data = req.query;
    let userId = await getUserId(data, db);
    let cartId = await getCartId(userId, db);
    let query =
      "SELECT b.book_id, b.title, b.description, b.price, ci.quantity, b.image " +
      "FROM Carts c " +
      "LEFT JOIN Cart_Items ci ON c.cart_id = ci.cart_id " +
      "LEFT JOIN Books b ON ci.book_id = b.book_id " +
      "WHERE c.cart_id = ?";
    let queryResult = await db.all(query, [cartId]);
    if (queryResult.length === 1 && queryResult[0].book_id === null) {
      queryResult = {};
    }
    res.json({cart: queryResult});
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * endpoint that updates the quantity for a certain item in cart. sends
 * success message in case of success, and failure message otherwise.
 */
app.post("/quantity/update", async (req, res) => {
  try {
    let db = await getDBConnection();
    let data = req.body;
    let userId = await getUserId(data, db);
    let cartId = await getCartId(userId, db);
    let bookId = data.bookId;
    let quantity = data.quantity;
    await selectBookQuantity(cartId, bookId, quantity, db);
    res.type("text").send("quanity updated successfully");
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
});

/**
 * Endpoint that places an order. Takes in session token, shipping address, and shipping method,
 * calculates total amount, tax, and updates the order, payment, and shipping information in the database.
 * Sends back a confirmation number in case of success.
 */
app.post("/order/placed", async (req, res) => {
  let db;
  try {
    db = await getDBConnection();
    await handlePlaceOrder(req, res, db);
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  } finally {
    if (db) {
      await db.close();
    }
  }
});

/**
 * Handles placing an order.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Object} db - The database connection object.
 */
async function handlePlaceOrder(req, res, db) {
  try {
    let data = req.body;
    let userId = await getUserId(data, db);
    let cartId = await getCartId(userId, db);
    let query =
      "SELECT ci.book_id, ci.quantity, b.price " +
      "FROM Cart_Items ci " +
      "LEFT JOIN Books b ON ci.book_id = b.book_id " +
      "WHERE cart_id = ?";
    let queryResult = await db.all(query, cartId);
    let totalAmount = calculateTotalAmount(queryResult);
    let tax = totalAmount * TAX_RATE;
    totalAmount = (totalAmount + tax).toFixed(2);
    let shippingAddress = data.shipping_address;
    await addToOrder(userId, totalAmount, shippingAddress, db);
    let orderId = await addToOrderItems(userId, queryResult, db);
    await addToPayment(orderId, totalAmount, db);
    let confirmationNumber = await addToShipping(orderId, data, db);
    await changeProductStock(queryResult, db);
    await resetCart(cartId, db);
    res.json({confirmationNumber: confirmationNumber});
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
}

/**
 * Calculates the total amount for the items in the cart.
 *
 * @param {Array} items - The list of items in the cart.
 * @returns {number} - The total amount.
 */
function calculateTotalAmount(items) {
  return items.reduce((total, item) => total + item.quantity * item.price, 0);
}

/**
 * Endpoint that gets the order history for a user based on the session token.
 * Sends back a JSON containing order details.
 */
app.get("/order-history", async (req, res) => {
  let db;
  try {
    db = await getDBConnection();
    await handleGetOrderHistory(req, res, db);
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  } finally {
    if (db) {
      await db.close();
    }
  }
});

/**
 * Handles retrieving order history for a user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Object} db - The database connection object.
 */
async function handleGetOrderHistory(req, res, db) {
  try {
    const query =
      "SELECT o.order_id, o.order_date, o.total_amount, u.first_name, u.last_name, " +
      "s.delivery_date, s.shipping_method, s.shipping_cost, s.tracking_number, s.shipped_date, " +
      "b.description, b.image " +
      "FROM Users u " +
      "LEFT JOIN Orders o ON u.user_id = o.user_id " +
      "LEFT JOIN Shipping s ON o.order_id = s.order_id " +
      "LEFT JOIN Order_Items oi ON o.order_id = oi.order_id " +
      "LEFT JOIN Books b ON oi.book_id = b.book_id " +
      "WHERE u.session_token = ? " +
      "ORDER BY o.order_date";
    let queryResult = await db.all(query, req.query.session_token);
    let orders = formatOrderHistory(queryResult);
    res.json({orders});
  } catch (error) {
    res.status(SERVER_ERROR)
      .type("text")
      .send(SERVER_ERROR_MSG);
  }
}

/**
 * Formats the order history results into a structured object.
 *
 * @param {Array} queryResult - The raw query result from the database.
 * @returns {Object} - The formatted order history.
 */
function formatOrderHistory(queryResult) {
  const orders = {};
  queryResult.forEach((row) => {
    if (!orders[row.order_id]) {
      orders[row.order_id] = {
        orderDate: row.order_date,
        totalAmount: row.total_amount,
        user: {
          firstName: row.first_name,
          lastName: row.last_name
        },
        shipping: {
          deliveryDate: row.delivery_date,
          shippingMethod: row.shipping_method,
          shippingCost: row.shipping_cost,
          trackingNumber: row.tracking_number,
          shippedDate: row.shipped_date
        },
        items: []
      };
    }
    orders[row.order_id].items.push({
      description: row.description,
      image: row.image
    });
  });
  return orders;
}

/**
 * Updates quantity of a book in the cart.
 * If quantity turns out to be zero, the book is removed from the cart.
 *
 * @param {number} cartId - The ID of the cart.
 * @param {number} bookId - The ID of the book.
 * @param {number} quantity - The quantity of the book to set in the cart.
 * @param {Object} db - The database connection object.
 */
async function selectBookQuantity(cartId, bookId, quantity, db) {
  let query = "SELECT cart_item_id FROM Cart_Items WHERE cart_id = ? AND book_id = ?";
  let cartItem = await db.get(query, [cartId, bookId]);
  let cartItemId = cartItem.cart_item_id;

  if (quantity === 0) {
    removeFromCartItems(cartId, bookId, db);
  } else {
    query = "UPDATE Cart_Items SET quantity = ? WHERE cart_item_id = ?";
    await db.run(query, [quantity, cartItemId]);
  }
  await setCartCount(cartId, db);
}

/**
 * Adds an order to the database.
 *
 * @param {number} userId - The ID of the user placing the order.
 * @param {number} totalAmount - The total amount of the order.
 * @param {string} shippingAddress - The shipping address for the order.
 * @param {Object} db - The database connection object.
 */
async function addToOrder(userId, totalAmount, shippingAddress, db) {
  const ORDER_STATUS = "completed";
  let query =
    "INSERT INTO Orders(user_id, order_status, total_amount, shipping_address, billing_address) " +
    "VALUES(?, ?, ?, ?, ?)";
  let billingAddress = shippingAddress;
  await db.run(query, [userId, ORDER_STATUS, totalAmount, shippingAddress, billingAddress]);
}

/**
 * Adds items to an order in the database.
 *
 * @param {number} userId - The ID of the user placing the order.
 * @param {Array} queryResult - The list of items in the order.
 * @param {Object} db - The database connection object.
 * @returns {number} - The ID of the order.
 */
async function addToOrderItems(userId, queryResult, db) {
  let query =
    "SELECT order_id FROM Orders WHERE user_id = ? ORDER BY order_date DESC LIMIT " +
    ORDER_LIMIT;
  let recentPlacedOrder = await db.get(query, userId);
  let orderId = recentPlacedOrder.order_id;
  query =
    "INSERT INTO Order_Items(order_id, book_id, price, quantity) VALUES(?, ?, ?, ?)";
  let promises = queryResult.map(async (element) => {
    try {
      await db.run(query, [orderId, element.book_id, element.price, element.quantity]);
    } catch (error) {
      throw error; // Optionally rethrow to handle it further up the call stack
    }
  });

  await Promise.all(promises);
  return orderId;
}

/**
 * Adds a payment record to the database.
 *
 * @param {number} orderId - The ID of the order.
 * @param {number} totalAmount - The total amount of the payment.
 * @param {Object} db - The database connection object.
 */
async function addToPayment(orderId, totalAmount, db) {
  let transactionId = generateTransactionId();
  let query =
    "INSERT INTO Payments(order_id, amount, payment_method, status, transaction_id) " +
    "VALUES (?, ?, ?, ?, ?)";
  await db.run(query, [orderId, totalAmount, PAYMENT_METHOD, PAYMENT_STATUS, transactionId]);
}

/**
 * Adds shipping information to the database.
 *
 * @param {number} orderId - The ID of the order.
 * @param {Object} data - The shipping information.
 * @param {Object} db - The database connection object.
 * @returns {string} - The tracking number for the shipment.
 */
async function addToShipping(orderId, data, db) {
  let shippingMethod = data.shipping_method;
  let shippingCost;
  let shippedDate = new Date();
  let deliveryDateQuery;
  if (shippingMethod === "express") {
    shippingCost = EXPRESS_SHIPPING_COST;
    deliveryDateQuery = `DATE(CURRENT_DATE, '+${EXPRESS_SHIPPING_DAYS} days')`;
  } else {
    shippingCost = STANDARD_SHIPPING_COST;
    deliveryDateQuery = `DATE(CURRENT_DATE, '+${STANDARD_SHIPPING_DAYS} days')`;
  }

  const trackingNumber = generateTrackingNumber();
  const query = `
    INSERT INTO Shipping (order_id, shipping_method, shipping_cost, tracking_number,
      shipped_date, delivery_date)
    VALUES (?, ?, ?, ?, ?, ${deliveryDateQuery})
  `;

  try {
    await db.run(query, [
      orderId,
      shippingMethod,
      shippingCost,
      trackingNumber,
      shippedDate.toISOString().split("T")[0] // Convert to YYYY-MM-DD format
    ]);
    return trackingNumber;
  } catch (err) {
    throw err;
  }
}

/**
 * Updates the stock quantity of products in the database.
 *
 * @param {Array} queryResult - The list of items in the order.
 * @param {Object} db - The database connection object.
 */
async function changeProductStock(queryResult, db) {
  let query = "UPDATE Books SET quantity = (quantity - ?) WHERE book_id = ?";
  let promises = queryResult.map(async (element) => {
    let quantity = element.quantity;
    let bookId = element.book_id;
    await db.run(query, [quantity, bookId]);
  });

  await Promise.all(promises);
}

/**
 * Resets the cart by removing all items and setting quantity to 0.
 *
 * @param {number} cartId - The ID of the cart.
 * @param {Object} db - The database connection object.
 */
async function resetCart(cartId, db) {
  let query = "DELETE FROM Cart_Items";
  await db.run(query);
  query = "UPDATE Carts SET quantity = 0 WHERE cart_id = ?";
  await db.run(query, cartId);
}

/**
 * Generates a random session token.
 *
 * @returns {string} - Randomly generated session token.
 */
function generateToken() {
  return crypto.randomBytes(SIXTY_FOUR).toString("hex");
}

/**
 * Generates a random transaction ID.
 *
 * @returns {string} - Randomly generated transaction ID.
 */
function generateTransactionId() {
  return crypto.randomBytes(SIXTEEN).toString("hex"); // Generates a 32-character hexadecimal string
}

/**
 * Generates a random tracking number.
 *
 * @returns {string} - Randomly generated tracking number.
 */
function generateTrackingNumber() {
  return crypto.randomBytes(EIGHT).toString("hex"); // Generates a 32-character hexadecimal string
}

/**
 * Based on a given get books request, sends back search results. Takes into account the
 * filter and search query applied.
 *
 * @param {Object} req - request object
 * @param {Object} db - database connection object
 * @returns {Object} - search results
 */
async function getBooksHelper(req, db) {
  let queryResults;
  if (req.query.type === "all") {
    const query =
      "SELECT book_id FROM Books WHERE LOWER(title) LIKE LOWER(?) OR LOWER(author) LIKE LOWER(?)";
    queryResults = await db.all(query, [
      "%" + req.query.search + "%",
      "%" + req.query.search + "%"
    ]);
  } else {
    const query = "SELECT book_id FROM Books WHERE LOWER(" + req.query.type + ") LIKE LOWER(?)";
    queryResults = await db.all(query, ["%" + req.query.search + "%"]);
  }
  return queryResults;
}

/**
 * Populates the given user info object with basic information stored in the request
 * like book id, rating, review and also the current date.
 *
 * @param {Object} req - request object
 * @param {Object} userInfo - object to populate
 */
function populateBasicUserInfo(req, userInfo) {
  userInfo.rating = req.body.rating;
  userInfo.review = req.body.review;
  userInfo.book_id = req.body.bookid;
  userInfo.created_at = new Date().toLocaleDateString();
}

/**
 * Authenticates a user based on the session token.
 * Adds the user information to the request object if authenticated.
 *
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Function} next - next middleware function
 */
async function authenticate(req, res, next) {
  let token = req.cookies.session_token;

  if (token) {
    try {
      let db = await getDBConnection();
      let query = "SELECT * FROM Users WHERE session_token = ?";
      let queryResult = await db.get(query, token);

      if (queryResult) {
        let resObj = {
          userId: queryResult.user_id,
          firstName: queryResult.first_name,
          lastName: queryResult.last_name
        };
        req.user = resObj;
      } else {
        // no user found with the provided token
        req.user = null;
      }
    } catch (error) {
      // error occurred during database access
      req.user = null;
    }
  } else {
    // no token provided
    req.user = null;
  }

  // proceed to the next middleware/route handler
  next();
}

/**
 * Gets the user ID based on the session token
 *
 * @param {Object} data - object containing the session token
 * @param {Object} db - database connection object
 * @returns {number or null} user ID if found, otherwise null
 */
async function getUserId(data, db) {
  // get the user_id from session token
  let sessionToken = data.session_token;
  let query = "SELECT user_id FROM Users WHERE session_token = ?";
  let user = await db.get(query, sessionToken);
  return user ? user.user_id : null;
}

/**
 * Removes item from cart
 *
 * @param {number} cartId - cart id
 * @param {number} bookId - book id
 * @param {Object} db - database connection object
 */
async function removeFromCartItems(cartId, bookId, db) {
  try {
    let query = "DELETE FROM Cart_Items WHERE cart_id = ? AND book_id = ?";
    await db.run(query, [cartId, bookId]);
  } catch (error) {}
}

/**
 * Sets the total quantity of items in the cart
 *
 * @param {number} cartId - cart id
 * @param {Object} db - database connection
 */
async function setCartCount(cartId, db) {
  let query = "SELECT quantity FROM Cart_Items WHERE cart_id = ?";
  let queryResult = await db.all(query, cartId);
  let totalQuantity = 0;
  queryResult.forEach((element) => {
    totalQuantity += element.quantity;
  });
  query = "UPDATE Carts SET quantity = ? WHERE cart_id = ?";
  await db.run(query, [totalQuantity, cartId]);
}

/**
 * Gets cart ID for a given user
 *
 * @param {number} userId - user id
 * @param {Object} db - database connection object
 */
async function getCartId(userId, db) {
  let query = "SELECT cart_id FROM Carts WHERE user_id = ?";
  let cart = await db.get(query, userId);
  return cart.cart_id;
}

/**
 * Updates cart items, incrementing the quantity if the item already exists,
 * and adding the item to the cart if it doesn"t exist.
 *
 * @param {number} cartId - cart id
 * @param {number} bookId - book id
 * @param {Object} db - database connection object
 */
async function updateCartItems(cartId, bookId, db) {
  let query = "SELECT cart_item_id FROM Cart_Items WHERE cart_id = ? AND book_id = ?";
  let cartItem = await db.get(query, [cartId, bookId]);
  if (cartItem) {
    let cartItemId = cartItem.cart_item_id;
    query = "UPDATE Cart_Items SET quantity = quantity + 1 WHERE cart_item_id = ?";
    await db.run(query, cartItemId);
  } else {
    query = "INSERT INTO Cart_Items(cart_id, book_id, quantity) VALUES(?, ?, 1)";
    await db.run(query, [cartId, bookId]);
  }
}

/**
 * Establishes a database connection to a database and returns the database object.
 * Any errors that occur during connection should be caught in the function
 * that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: "ecommerce.db",
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static(path.join(__dirname, "public")));
const PORT = process.env.PORT || LOCAL_PORT;
app.listen(PORT);
