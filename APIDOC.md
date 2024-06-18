# BestBook Store API Documentation
This API allows users to get information about books in inventory for an online bookstore. It includes endpoints that allow users to look for books, purchase them, and leave reviews + manage other user activities.

All images and descriptions sourced from GoodReads.

## Get Books
**Request Format:** /get-books

**Request Type:** GET

**Query Params:** optional (both must be provided if provided though)

- search: search query
- type: filter type (one of: author, title, genre, All)

**Returned Data Format**: JSON

**Description:** Gets information about all the books in the inventory (title, author, genre, year, publisher, summary, price, quantity). If query params are provided, then returns the book ids of books that match the results.

**Example Request 1:** /get-books

**Example Response 1:**
```json
{
  "books": [
    {
      "book_id": 2,
      "title": "1984",
      "author": "George Orwell",
      "price": 8.99,
      "genre": "Dystopian",
      "format": "Paperback",
      "publisher": "Penguin Random House",
      "image": "1348990566l/5470.jpg"
    },
    {
      "book_id": 28,
      "title": "1984",
      "author": "George Orwell",
      "price": 12.99,
      "genre": "Dystopian",
      "format": "Hardcover",
      "publisher": "Mariner Books Classics",
      "image": "1532714506i/40961427.jpg"
    },
    {
      "book_id": 22,
      "title": "A Tale of Two Cities",
      "author": "Charles Dickens",
      "price": 10.99,
      "genre": "Historical Fiction",
      "format": "Paperback",
      "publisher": "Penguin Classics",
      "image": "1344922523l/1953.jpg"
    },
    ...
  ]
}
```

**Example Request 2:** /get-books?search=1984&type=title

**Example Response 2:**
```json
{
   "books":[
      {
         "book_id":2
      },
      {
         "book_id":28
      }
   ]
}
```



**Error Handling:**
If any server error occurs, a 500 status code is returned with a message describing the error.

If the type parameter is not "title", "author", "genre" or "all", an error indicating: "The type parameter has an invalid value." is sent back with 400 status code.

## Get Book
**Request Format:** /get-book/:bookid

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Gets information about a given book. Takes in a parameter which represents the unique identifier of the book and sends back a json that contains information about it. Sends back error in case the book does not exist in the inventory (look at error handling section).

**Example Request:** /get-book/1

**Example Response:**
```json
{
   "book_id":1,
   "title":"The Great Gatsby",
   "description":"The Great Gatsby is a classic novel by F. Scott Fitzgerald, set in the Jazz Age and focusing on the mysterious millionaire Jay Gatsby and his obsession with the beautiful Daisy Buchanan.",
   "price":10.99,
   "quantity":0,
   "format":"Hardcover",
   "publisher":"Charles Scribner's Sons",
   "author":"F. Scott Fitzgerald",
   "genre":"Classic",
   "image":"1490528560l/4671.jpg"
}
```

**Error Handling:**
- If the provided book ID does not exist, a 400 status code is returned with a message specifying: "Book id not found."
- If a book ID is not given, also indicates so with a 400 status code.
- If any server error occurs, a 500 status code is returned with a message describing the error.


## Add review
**Request Format:** /add-review

**Request Body (params):**
- bookid: The unique identifier of the book
- rating: The rating given by the user
- review: The text review provided by the user

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Adds a user review to the specified book. Sends back a json with information on the user, the review, the book and the updated average rating + num reviews left. Gets the user from the session token sent through a cookie with the response.

**Example Request Body:**
```json
{
  "bookid": "2",
  "rating": 5,
  "review": "Amazing book"
}
```

**Example Response:**

```json
{
    "user_id": 1,
    "first_name": "Suhani",
    "last_name": "Arora",
    "review_id": 6,
    "rating": "5",
    "review": "Amazing book",
    "created_at": "6/4/2024",
    "book_id": "2",
    "avgRating": 3.6666666666666665,
    "ratingCount": 3
}
```

**Error Handling:**
- If the provided book ID does not exist, a 400 status code is returned with a message specifying: "Book id not found."
- If any required parameter is missing or invalid, a 400 status code is returned with a message indicating the issue.
- If any server error occurs, a 500 status code is returned with a message describing the error.

## Get Reviews
**Request Format:** /get-reviews/:bookid

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Gets reviews for a specified book. Sends back a json

**Example Request:** /get-reviews/2

**Example Response:**

```json
{
    "reviews": [
        {
            "rating": 5,
            "review": "Amazing book",
            "user_id": 1,
            "last_name": "Arora",
            "review_id": 6,
            "first_name": "Suhani",
            "created_at": "2024-06-04 07:59:24",
            "book_id": 2
        },
        {
            "rating": 3,
            "review": "hi",
            "user_id": 1,
            "last_name": "Arora",
            "review_id": 3,
            "first_name": "Suhani",
            "created_at": "2024-05-31 08:31:30",
            "book_id": 2
        },
        {
            "rating": 3,
            "review": "Great read!",
            "user_id": 1,
            "last_name": "Arora",
            "review_id": 1,
            "first_name": "Suhani",
            "created_at": "2024-05-31 06:47:02",
            "book_id": 2
        }
    ],
    "avgRating": 3.6666666666666665
}
```

**Error Handling:**
- If the provided book ID does not exist, a 400 status code is returned with a message specifying: "Book id not found."
- If any required parameter is missing or invalid, a 400 status code is returned with a message indicating the issue.
- If any server error occurs, a 500 status code is returned with a message describing the error.

## User login
**Request Format:** /login

**Request Body (params):**
- email
- password

**Request Type:** POST

**Returned Data Format**: text

**Description:** Takes an email and password and authenticates a users credentials. If successful, establishes a session for the user by generating a unique session token. Indicates if the login was successful in the response.

**Example Request Body:**
```json
{
  "email": "suhani.arora@example.com",
  "password": "password123"
}
```

**Example Response:**

```
// login successful
log in successfully: suhani.arora@example.com

// login failed
Account not registered
```

**Error Handling:**
- If any required parameter is missing, a 400 status code is returned with a message indicating the issue.
- If login failed, a 400 status code is returned with a message indicating so.
- If any server error occurs, a 500 status code is returned with a message describing the error.

## User logout
**Request Format:** /logout

**Request Type:** POST

**Returned Data Format**: text

**Description:** Extracts session token from response cookies and logs the corresponding user out.
If no user was logged in with that session token, then an error indicating so is sent back.

**Example Response:**

```
Successfully logged out.
```

**Error Handling:**
- If no user is logged in, a 400 status code is returned with a message indicating the issue.
- If any server error occurs, a 500 status code is returned with a message describing the error.

## Buy Book
**Request Format:** /buy-book

**Request Body (params):**
- book-id: book to buy
- username: user buying the book

**Request Type:** POST

**Returned Data Format**: text

**Description:** Performs purchase of a provided book for the given user. If the book was purchased successfully, users can view it in their order history.

**Example Request Body (params):**
```json
{
  "book-id": 19382,
  "username": "booklover",
}
```

**Example Response:**

```
Book purchased successfully.
```

**Error Handling:**
- If the provided book ID does not exist, a 400 status code is returned with a message specifying: "Book not found."
- If the user does not exist, a 400 status code is returned with a message specifying: "User not found."
- If any required parameter is missing or invalid, a 400 status code is returned with a message indicating the issue.
- If any server error occurs, a 500 status code is returned with a message describing the error.

## Add to Cart
**Request Format:** /cart/add

**Request Body (params):**
- book-id: book to add
- username: user adding the book to cart

**Request Type:** POST

**Returned Data Format**: text

**Description:** Adds a specified book to a specified user's cart.

**Example Request Body (params):**
```json
{
  "book-id": 19382,
  "username": "booklover",
}
```

**Example Response:**

```
Book added to cart successfully.
```

**Error Handling:**
- If the provided book ID does not exist, a 400 status code is returned with a message specifying: "Book not found."
- If the user does not exist, a 400 status code is returned with a message specifying: "User not found."
- If any required parameter is missing or invalid, a 400 status code is returned with a message indicating the issue.
- If any server error occurs, a 500 status code is returned with a message describing the error.

## Remove from Cart
**Request Format:** /cart/remove

**Request Body (params):**
- book-id: book to remove
- username: user removing the book from cart

**Request Type:** POST

**Returned Data Format**: text

**Description:** Removes a specified book from a specified user's cart.

**Example Request Body (params):**
```json
{
  "book-id": 19382,
  "username": "booklover",
}
```

**Example Response:**

```
Book removed from cart successfully.
```

**Error Handling:**
- If the provided book ID does not exist, a 400 status code is returned with a message specifying: "Book not found."
- If the provided book ID does not exist in the cart, a 400 status code is returned with the message saying: "Book not in cart!"
- If the user does not exist, a 400 status code is returned with a message specifying: "User not found."
- If any required parameter is missing or invalid, a 400 status code is returned with a message indicating the issue.
- If any server error occurs, a 500 status code is returned with a message describing the error.

## Get Cart
**Request Format:** /get-cart/:username

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Gets all the items in a specified user's cart. For each item, gets its title, price and unique id. If cart is empty, "books" array in JSON will be empty and total-price will be 0.

**Example Request:** /get-cart/booklover

**Example Response:**

```json
{
  "books": [
    {
      "name": "The Great Gatsby",
      "price": 10.99,
      "book-id": 18397
    },
    {
      "name": "To Kill a Mockingbird",
      "price": 12.50,
      "book-id": 10298
    }
  ],
  "total-price": 23.49
}

```

**Error Handling:**
- If the user does not exist, a 400 status code is returned with a message specifying: "User not found."
- If any required parameter is missing or invalid, a 400 status code is returned with a message indicating the issue.
- If any server error occurs, a 500 status code is returned with a message describing the error.

## Get Order History
**Request Format:** /get-order-history/:username

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Gets the order history of a provided user. For each item, gets its title, price, purchase date and unique id. If order history is empty, array will be empty.

**Example Request:** /get-order-history/booklover

**Example Response:**

```json
{
  [
    {
      "name": "The Great Gatsby",
      "price": 10.99,
      "book-id": 18397,
      "purchase-date": "10/01/2023"
    },
    {
      "name": "To Kill a Mockingbird",
      "price": 12.50,
      "book-id": 10298,
      "purchase-date": "10/01/2023"
    }
  ],
}
```

**Error Handling:**
- If the user does not exist, a 400 status code is returned with a message specifying: "User not found."
- If any required parameter is missing or invalid, a 400 status code is returned with a message indicating the issue.
- If any server error occurs, a 500 status code is returned with a message describing the error.