/*
 * Name: Suhani Arora + Oscar Wang
 * Date: May 5, 2024
 * Section: CSE 154 AD
 * TAs: Max Beard + Allan N Tran
 *
 * This is the JS to implement the UI the home page. The user can search for books, view popular
 * books and recent searches. After searching, they can even view information about specific
 * products and leave reviews on them. They can further buy products and add them to their cart.
 * There is also a nav bar on the side which allows users to go to different pages and logout.
 */

"use strict";

(function() {
  const NUM_STARS = 5;
  const GOOD_READS_IMG_URL = "https://images.gr-assets.com/books/";
  const STARNUM_INDEX = 4;
  const ROUND_HUNDRED = 100;
  const ERROR_MSG_TIME = 2000;
  window.addEventListener("load", init);

  /**
   * Executed on initialization of page. Loads page.
   */
  function init() {
    if (getCookieValue("session_token")) {
      toggleLogInRights(true);
    } else {
      toggleLogInRights(false);
    }
    id("grid-check").addEventListener("change", toggleGridView);
    loadAllBooks();
    id("search-btn").addEventListener("click", (event) => {
      event.preventDefault();
      performSearch();
    });
  }

  /**
   * Sets the view of the navbar based on if the user is logged in or not. If user is logged in,
   * then shows all navbar options. Otherwise, only shows home and login options.
   *
   * @param {boolean} enable - true if user is logged in and false otherwise
   */
  function toggleLogInRights(enable) {
    let navBar = qs(".side-nav ul");
    for (let i = 1; i < navBar.children.length; i++) {
      if (enable) {
        navBar.children[i].classList.remove("hidden");
      } else {
        navBar.children[i].classList.add("hidden");
      }
    }
    if (enable) {
      navBar.children[navBar.children.length - 1].classList.add("hidden");
    } else {
      navBar.children[navBar.children.length - 1].classList.remove("hidden");
    }
  }

  /**
   * Toggles view of book results from list to grid and vice versa based on what option the user
   * has selected.
   */
  function toggleGridView() {
    if (this.checked) {
      id("books-list").classList.add("books-grid-style");
      let prodItems = qsa(".product-item");
      for (let i = 0; i < prodItems.length; i++) {
        prodItems[i].classList.add("product-item-grid");
      }
    } else {
      id("books-list").classList.remove("books-grid-style");
      let prodItems = qsa(".product-item");
      for (let i = 0; i < prodItems.length; i++) {
        prodItems[i].classList.remove("product-item-grid");
      }
    }
  }

  /**
   * Loads and displays all books when the page loads. Displays images of the books and other
   * helpful information.
   */
  function loadAllBooks() {
    id("books-list").classList.remove("hidden");
    id("books-info").classList.add("hidden");
    fetch("/get-books")
      .then(statusCheck)
      .then((res) => res.json())
      .then((res) => {
        for (let i = 0; i < res["books"].length; i++) {
          id("books-list").appendChild(displayBook(res["books"][i]));
        }
      })
      .catch(handleError);
  }

  /**
   * Displays a singular search result and returns it.
   * @param {object} book - the book to display
   * @return {object} - singular search result that was generated.
   */
  function displayBook(book) {
    let result = gen("article");
    result.id = book["book_id"];
    result.classList.add("product-item");
    let img = gen("img");
    img.src = GOOD_READS_IMG_URL + book["image"];
    img.alt = "cover of " + book["title"];
    img.classList.add("popular-book-img");

    let infoSection = createInfoSection(book);

    result.appendChild(img);
    result.appendChild(infoSection);
    result.addEventListener("click", bookClicked);
    return result;
  }

  /**
   * Generates the information section of the book in the singular search result (displays
   * various different info like publisher, authot, title, price and more).
   *
   * @param {object} book - book whos information needs to be displayed
   * @returns {object} - returns a section containing the information
   */
  function createInfoSection(book) {
    let section = gen("section");
    section.classList.add("product-info");
    section.id = book["book_id"];
    let title = gen("p");
    title.classList.add("title");
    title.textContent = book["title"];
    let author = gen("p");
    author.textContent = "Author: " + book["author"];
    let publisher = gen("p");
    publisher.textContent = "Publisher: " + book["publisher"];
    let price = gen("p");
    price.textContent = "$" + book["price"];
    price.classList.add("price");
    let type = gen("p");
    type.textContent = book["format"];
    section.appendChild(title);
    section.appendChild(author);
    section.appendChild(publisher);
    section.appendChild(price);
    section.appendChild(type);
    return section;
  }

  /**
   * Handles user making a search. Extrapolates the search query and the filter (what user searched
   * by) and displays the results of that search on the homepage.
   */
  function performSearch() {
    if (id("search").value.trim().length === 0) {
      id("search-error").classList.remove("hidden");
    } else {
      id("books-list").classList.remove("hidden");
      id("books-info").classList.add("hidden");
      id("search-error").classList.add("hidden");
      fetch("/get-books?search=" + id("search").value + "&type=" + qs("select").value)
        .then(statusCheck)
        .then((res) => res.json())
        .then(hideNonSearchElements)
        .catch(handleError);
    }
  }

  /**
   * Hides any elements that were not a result of the search from the page, only displaying the
   * relevant books.
   * @param {array} searchBooks - array of book ids that was the result of the search
   */
  function hideNonSearchElements(searchBooks) {
    let prodList = id("books-list");
    for (let i = 0; i < prodList.children.length; i++) {
      if (!idInResult(searchBooks, prodList.children[i].id)) {
        prodList.children[i].classList.add("hidden");
      } else {
        prodList.children[i].classList.remove("hidden");
      }
    }
  }

  /**
   * Returns true if the given id exists in the array of ids in the given json, and false otherwise
   * @param {json} searchBooks - array of book ids
   * @param {string} id - id to look for in array of book ids
   * @returns {boolean} - true if the provided id exists in the provided json, false otherwise
   */
  function idInResult(searchBooks, id) {
    for (let i = 0; i < searchBooks["books"].length; i++) {
      if (searchBooks["books"][i]["book_id"] === parseInt(id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Handles the click of a product, and displays specific information on the product along
   * with reviews. If user is logged in, they get extra functionality like buying books and
   * leaving reviews.
   */
  function bookClicked() {
    id("search-result-msg").classList.add("hidden");
    fetch("/get-book/" + this.id)
      .then(statusCheck)
      .then(res => res.json())
      .then(res => {
        showProductInfo(res, this.id);
      })
      .catch(handleError);
  }

  /**
   * Displays information about a certain product that the user selects after searching. It also
   * shows option to add to cart and buy the product (if user is logged in).
   * It then displays the reviews left by users.
   * @param {object} book - represents information about a specific book
   * @param {string} bookid - id of the book
   *
   */
  function showProductInfo(book, bookid) {
    id("books-info").innerHTML = "";
    id("search-result-msg").classList.add("hidden");
    id("books-list").classList.add("hidden");
    id("books-info").classList.remove("hidden");

    let productSection = gen("section");
    productSection.id = "prod-section";
    productSection.classList.add("product-info");
    let productImg = gen("img");
    productImg.src = GOOD_READS_IMG_URL + book["image"];
    productImg.alt = "cover of " + book["title"];
    productSection.appendChild(productImg);
    productSection.appendChild(generateBookInfo(book));
    id("books-info").appendChild(productSection);
    showReviewForm(bookid);
  }

  /**
   * Generates section about information about a book and returns it.
   * @param {object} book - information about the book.
   * @return {object} - section about information about a book.
   */
  function generateBookInfo(book) {
    let section = createInfoSection(book);
    let summary = gen("p");
    summary.textContent = book["description"];
    section.appendChild(summary);
    if (getCookieValue("session_token") && book["quantity"] > 0) {

      // let buyNow = gen("button");

      // buyNow.textContent = "Buy Now";

      let addToCart = gen("button");
      addToCart.textContent = "Add to cart";
      addToCart.classList.add("cart-btn");
      addToCart.addEventListener("click", addToShoppingCart);

      // section.appendChild(buyNow);

      section.appendChild(addToCart);
    } else if (book["quantity"] === 0) {
      let lowStockP = gen("p");
      lowStockP.textContent = "Out of stock";
      lowStockP.classList.add("out-of-stock");
      section.appendChild(lowStockP);
    }
    return section;
  }

  /**
   * Displays the review form under the product information along with the submitted reviews.
   * Users have options to rate books and write a text review.
   * @param {string} bookid - id of the book
   */
  function showReviewForm(bookid) {
    let reviewSection = gen("section");
    reviewSection.id = "review-section";
    let reviewHeader = gen("h1");
    reviewHeader.textContent = "Product Reviews";
    reviewSection.appendChild(reviewHeader);
    let avgRating = gen("p");
    avgRating.id = "avg-rating";
    avgRating.textContent = "Average rating: 0 / 5 (0 reviews)";
    reviewSection.appendChild(avgRating);
    if (getCookieValue("session_token")) {
      let rating = gen("p");
      rating.id = "selected-rating";
      rating.textContent = "0 / 5";
      reviewSection.appendChild(rating);
    }
    let stars = gen("section");
    stars.id = "stars-section";
    for (let i = 1; i <= NUM_STARS; i++) {
      let star = gen("span");
      star.classList.add("review-star");
      star.id = "star" + i;
      star.textContent = "☆";
      star.addEventListener("click", selectRating);
      stars.appendChild(star);
    }
    generateEnterReviewPart(reviewSection, stars, bookid);
  }

  /**
   * Displays the part under the stars (the enter review part) of the product info page.
   * Note this only happens in the case the user is logged in. Otherwise, users should not
   * have the right to do so.
   * @param {object} reviewSection - the section to append the parts to.
   * @param {object} stars - the section that represents the stars input.
   * @param {string} bookid - id of the book
   */
  function generateEnterReviewPart(reviewSection, stars, bookid) {
    if (getCookieValue("session_token")) {
      generateReviewContent(reviewSection, stars, bookid);
    }
    let leftReviews = gen("section");
    leftReviews.id = "existing-reviews";
    reviewSection.appendChild(leftReviews);
    id("books-info").appendChild(reviewSection);
    loadAllReviewsForBook(bookid);
  }

  /**
   * Displays the part under the stars (the enter review part) of the product info page.
   * Note this only happens in the case the user is logged in. Otherwise, users should not
   * have the right to do so.
   * @param {object} reviewSection - the section to append the parts to.
   * @param {object} stars - the section that represents the stars input.
   * @param {string} bookid - id of the book
   */
  function generateReviewContent(reviewSection, stars, bookid) {
    let clear = gen("span");
    clear.textContent = "✕";
    clear.id = "clear-icon";
    clear.addEventListener("click", resetStars);
    stars.appendChild(clear);
    reviewSection.appendChild(stars);
    let reviewMessage = gen("p");
    reviewMessage.textContent = "Leave a review:";
    let reviewInput = gen("textarea");
    reviewInput.id = "review-box";
    let button = gen("button");
    button.id = "review-btn";
    button.textContent = "Submit";
    button.addEventListener("click", () => {
      handleReviewLeft(bookid);
    });
    let errorMsg = gen("p");
    errorMsg.id = "review-error";
    errorMsg.classList.add("error-msg");
    errorMsg.classList.add("hidden");
    errorMsg.textContent = "Please enter a review and rating";
    reviewSection.appendChild(reviewMessage);
    reviewSection.appendChild(reviewInput);
    reviewSection.appendChild(button);
    reviewSection.appendChild(errorMsg);
  }

  /**
   * Reset the rating stars input to be empty. Rating is reset to 0/5.
   */
  function resetStars() {
    id("selected-rating").textContent = "0 / 5";
    id("review-box").value = "";
    for (let i = 1; i <= NUM_STARS; i++) {
      id("star" + i).textContent = "☆";
      id("star" + i).classList.remove("selected");
    }
  }

  /**
   * Sets the rating stars input after a star is selected. Every star till and inclusive of the
   * one selected is filled and colored gold.
   */
  function selectRating() {
    let starNum = parseInt(this.id.substring(STARNUM_INDEX));
    id("selected-rating").textContent = starNum + " / 5";
    for (let i = 1; i <= NUM_STARS; i++) {
      if (i <= starNum) {
        id("star" + i).textContent = "★";
        id("star" + i).classList.add("selected");
      } else {
        id("star" + i).textContent = "☆";
        id("star" + i).classList.remove("selected");
      }
    }
  }

  /**
   * Adds a review to the submitted reviews once a user submits a rating + review. If the rating
   * or review is empty, an error message is displayed.
   * @param {string} bookid - id of the book
   */
  function handleReviewLeft(bookid) {
    let ratingSelected = id("selected-rating");
    let ratingLeft = parseInt(ratingSelected.textContent.substring(0, 1));
    let reviewLeft = id("review-box").value;
    if (ratingLeft === 0 || reviewLeft.length === 0) {
      id("review-error").classList.remove("hidden");
    } else {
      id("review-error").classList.add("hidden");
      let params = new FormData();
      params.append("rating", ratingLeft);
      params.append("review", reviewLeft);
      params.append("bookid", bookid);
      fetch("/add-review", {method: "POST", body: params})
        .then(statusCheck)
        .then(res => res.json())
        .then((res) => {
          setAvgRating(res["avgRating"], res["ratingCount"]);
          displayReview(res);
        })
        .catch(handleError);
    }
  }

  /**
   * Sets the average rating on the page anytime it loads or a user adds a rating.
   * @param {double} avgRating - The average rating on the book.
   * @param {int} numRatings - The number of ratings left on the book.
   */
  function setAvgRating(avgRating, numRatings) {
    id("avg-rating").textContent = "Average rating: " +
                                    (Math.round(avgRating * ROUND_HUNDRED) / ROUND_HUNDRED) +
                                    " / 5 (" + numRatings + " reviews)";
  }

  /**
   * Loads all reviews for a given book and displays them on the page.
   * @param {string} bookid - id of the book
   */
  function loadAllReviewsForBook(bookid) {
    fetch("/get-reviews/" + bookid)
      .then(statusCheck)
      .then(res => res.json())
      .then(res => {
        for (let i = res["reviews"].length - 1; i >= 0; i--) {
          setAvgRating(res["avgRating"], res["reviews"].length);
          res["reviews"][i]["created-at"] = new Date((res["reviews"][i]["created-at"]))
            .toLocaleDateString();
          displayReview(res["reviews"][i]);
        }
      })
      .catch(handleError);
  }

  /**
   * Displays the specific review submitted.
   * @param {object} reviewInfo - information about the review (such as rating and comment) to
   * display.
   */
  function displayReview(reviewInfo) {
    let review = gen("article");
    review.classList.add("review");
    review.id = reviewInfo["book_id"] + "." + reviewInfo["review_id"];
    let rating = gen("p");
    for (let i = 0; i < reviewInfo["rating"]; i++) {
      rating.textContent += "★";
    }
    let name = gen("p");
    name.textContent = reviewInfo["first_name"] + " " + reviewInfo["last_name"];
    name.classList.add("review-metadata");
    let datePosted = gen("p");
    datePosted.textContent = reviewInfo["created_at"];
    datePosted.classList.add("review-metadata");
    let reviewText = gen("p");
    reviewText.textContent = reviewInfo["review"];
    review.appendChild(rating);
    review.appendChild(name);
    review.appendChild(datePosted);
    review.appendChild(reviewText);
    id("existing-reviews").prepend(review);
    if (getCookieValue("session_token")) {
      resetStars();
    }
  }

  /**
   * Helper function for getting the cookie given the name of the cookie
   * @param {string} key - cookie key
   * @returns {string} - the cookie value associated with the given key
   */
  function getCookieValue(key) {
    let cookies = document.cookie
      .split(";")
      .map((cookie) => cookie.split("="))
      .reduce((accumulator, [cookieKey, cookieValue]) => {
        accumulator[cookieKey.trim()] = decodeURIComponent(cookieValue);
        return accumulator;
      }, {});

    return cookies[key.trim()] || null;
  }

  /**
   * Adds item to shopping cart when a user clicks on the add to cart button. Once a user
   * navigates to the cart, it will appear.
   */
  async function addToShoppingCart() {
    try {
      let bookId = this.parentNode.id;
      let userToken = getCookieValue("session_token");
      let params = {
        "session_token": userToken,
        "bookId": parseInt(bookId)
      };
      let response = await fetch("/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
      });

      await statusCheck(response);
    } catch (error) {
      handleError(error);
    }
  }

  /**
   * Handles errors by displaying an error message to the user in a popup banner at the bottom
   * of the page.
   * @param {Error} error - The error to handle.
   */
  function handleError(error) {
    let footer = gen("footer");
    let errorP = gen("p");
    errorP.textContent = error;
    footer.appendChild(errorP);
    qs("body").appendChild(footer);
    setTimeout(() => {
      footer.remove();
    }, ERROR_MSG_TIME);
  }

  /**
   * Helper function to return the response"s result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @async
   * @param {object} res - response to check for success/error
   * @returns {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID.
   * @returns {object} - DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Generates a new DOM object of the given HTML tag and returns it.
   * @param {string} tag - HTML tag
   * @returns {object} - DOM object generated.
   */
  function gen(tag) {
    return document.createElement(tag);
  }

  /**
   * Returns first element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns all elements matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {array} - array of DOM object associated selector.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }
})();

