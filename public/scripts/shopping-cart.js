/**
 * Name: Oscar Wang
 * Date: May 05, 2024
 * Section: CSE 154 AD
 *
 * This is the JS to implement a shopping cart and allow user
 * to proceed to checkout or delete items
 */

"use strict";
(function() {
  window.addEventListener("load", init);

  const GOOD_READS_IMG_URL = "https://images.gr-assets.com/books/";
  const QUANT_NUM = 10;

  /**
   * Initializes the application, primarily logging a startup message.
   */
  function init() {
    createItem();
  }

  /**
   * Creates a new item element and appends it to the shopping cart.
   */
  async function createItem() {
    let data = await getCartInfo();
    displayCart(data);
    getSubTotal(data);
  }

  /**
   * Calculates the subtotal and total quantity of items in the cart then
   * updates the subtotal display and creates a checkout button
   *
   * @param {Array} data - An array of cart items, each with price and quantity
   */
  function getSubTotal(data) {
    let total = 0;
    let totalQuantity = 0;

    if (data.length) {
      data.forEach((element) => {
        total += element.price * element.quantity;
        totalQuantity += element.quantity;
      });
    }
    let subTotal = qs(".sub-total");
    subTotal.innerHTML = "";
    let title = gen("h2");
    title.textContent = `Subtotal (${totalQuantity} items): $${total}`;

    let button = gen("button");
    button.id = "checkout-button";
    button.textContent = "Proceed to Checkout";
    button.addEventListener("click", async function() {
      let data2 = await getCartInfo();
      if (data2.length) {
        button.disabled = false;
        window.location.href = "./purchase-product.html";
      } else {
        button.disabled = true;
      }
    });

    subTotal.appendChild(title);
    subTotal.appendChild(button);
  }

  /**
   * Displays the shopping cart items on the page. Clears the current content of the shopping cart
   * element and populates it with the provided data.
   *
   * @param {Array} data - array of cart items, each containing the necessary properties
   */
  function displayCart(data) {
    let shoppingCart = qs(".shopping-cart");
    shoppingCart.innerHTML = "";

    let priceTitle = gen("p");
    priceTitle.textContent = "Price";
    let line = gen("hr");
    shoppingCart.appendChild(priceTitle);
    shoppingCart.appendChild(line);
    if (data.length) {
      data.forEach((element) => {
        let itemDiv = gen("div");
        itemDiv.className = "item";

        // Append the img, description, and price elements to the item div.
        itemDiv.appendChild(createImage(element));
        itemDiv.appendChild(createItemDescription(element));
        itemDiv.appendChild(createPrice(element));

        // Append the fully constructed item div to the shopping cart.
        shoppingCart.appendChild(itemDiv);
      });
    }
  }

  /**
   * Creates an image element for an item.
   * @param {object} data - helped in creating img
   * @return {HTMLImageElement} - The image element configured for the item.
   */
  function createImage(data) {
    let img = gen("img");
    img.src = GOOD_READS_IMG_URL + data.image;
    img.alt = data.title;
    return img;
  }

  /**
   * Constructs the description section of an item, including title and delivery information.
   * @param {object} data - data to create item desc of
   * @return {HTMLElement} The item description element.
   */
  function createItemDescription(data) {
    let itemDescription = gen("div");
    itemDescription.className = "item-description";

    let title = gen("h2");
    title.textContent = data.title;
    itemDescription.appendChild(title);

    let description = gen("p");
    description.textContent = data.description;
    itemDescription.appendChild(description);

    // Append a quantity selector to the item description.
    itemDescription.appendChild(createQuantitySelector(data));

    return itemDescription;
  }

  /**
   * Creates a quantity selector for an item, allowing users to choose how many to purchase.
   * @param {object} data - data to create quantity selector of
   * @return {HTMLElement} - The quantity selector div.
   */
  function createQuantitySelector(data) {
    let quantityDiv = gen("div");
    let label = gen("label");
    label.setAttribute("for", data.book_id);
    label.textContent = "Quantity: ";
    quantityDiv.appendChild(label);

    let select = gen("select");
    select.name = "quantity";
    select.id = data.book_id;
    select.addEventListener("change", async function() {
      await updateQuantity(data);
    });

    // Populate the select element with options for quantities.
    for (let i = 0; i <= QUANT_NUM; i++) {
      let option = gen("option");
      option.value = i;
      option.textContent = i === 0 ? "0 (Delete)" : i;
      if (i === data.quantity) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    quantityDiv.appendChild(select);
    return quantityDiv;
  }

  /**
   * Updates quantity of a book in the cart by
   * refreshing the cart display and subtotal after the update
   *
   * @param {Object} data - object containing the book ID
   */
  async function updateQuantity(data) {
    try {
      let quantity = id(data.book_id).value;

      let bookId = data.book_id;
      let sessionToken = getCookieValue("session_token");
      let params = {
        "bookId": bookId,
        "session_token": sessionToken,
        "quantity": parseInt(quantity)
      };

      let response = await fetch("/quantity/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
      });

      await statusCheck(response);

      data = await getCartInfo();
      displayCart(data);
      getSubTotal(data);
    } catch (error) {
      throw Error;
    }
  }

  /**
   * Creates and returns a price element for an item.
   * @param {object} data - data to get price of
   * @return {HTMLParagraphElement} The paragraph element displaying the price.
   */
  function createPrice(data) {
    let price = document.createElement("p");
    price.classList.add("price");
    price.textContent = data.price;
    return price;
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
   * Fetches the cart information for the current session
   * It gets the session token from cookies and makes a request to the server for the cart data
   *
   * @returns {Array} array of cart items
   * @throws Will throw an error if the fetch operation fails or the response is invalid.
   */
  async function getCartInfo() {
    try {
      let sessionToken = getCookieValue("session_token");
      let response = await fetch(`/cart?session_token=${sessionToken}`);
      await statusCheck(response);
      let data = await response.json();
      data = data.cart;
      return data;
    } catch (error) {
      throw Error;
    }
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
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
   * Queries the document for the first element matching the selector.
   * @param {string} selector - The selector string to match elements against.
   * @return {Element} The first matching element.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Creates a new HTML element with the specified tag name.
   * @param {string} tagName - The tag name for the element to create.
   * @return {Element} The newly created element.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

  /**
   * Gets an element by its ID.
   * @param {string} id - The ID of the element.
   * @return {Element} The element with the specified ID.
   */
  function id(id) {
    return document.getElementById(id);
  }
})();
