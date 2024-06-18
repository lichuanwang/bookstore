/**
 * Name: Oscar Wang
 * Date: May 05, 2024
 * Section: CSE 154 AD
 *
 * This is the JS to implement the order history of users' purchases
 */

"use strict";

const GOOD_READS_IMG_URL = "https://images.gr-assets.com/books/";

/**
 * Initializes and configures the environment when the document is loaded.
 */
(function() {
  window.addEventListener("load", init);

  /**
   * Executes on initialization of page.
   */
  async function init() {
    await recordPurchase();
  }

  /**
   * Retrieves the value of a specified cookie.
   * @param {string} key - The key of the cookie to retrieve.
   * @return {string|null} The value of the cookie, or null if not found.
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
   * Records a purchase by creating a visual representation of the order
   * and appending it to the order list.
   */
  async function recordPurchase() {
    try {
      let sessionToken = getCookieValue("session_token");
      if (!sessionToken) {
        throw new Error("Session token not found.");
      }

      let response = await fetch(
        `/order-history?session_token=${sessionToken}`
      );

      await statusCheck(response);
      let result = await response.json();
      let data = result.orders;
      let allOrders = qs(".orders");

      for (let orderId in data) {
        let order = data[orderId];
        let singleOrder = gen("div");
        singleOrder.classList.add("order");

        // Generate the summary and details sections of the order.
        let orderSummary = createOrderSummary(order);
        let orderDetails = createOrderDetails(order);

        // Append both sections to the single order container.
        singleOrder.appendChild(orderSummary);
        singleOrder.appendChild(orderDetails);

        // Append the completed order to the main orders container on the page.
        allOrders.appendChild(singleOrder);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Creates an order summary including the date the order was placed and other relevant details.
   * @param {Object} order - The order data object.
   * @return {HTMLElement} The container element with the order summary.
   */
  function createOrderSummary(order) {
    let outerContainer = gen("div");
    outerContainer.classList.add("order-summary");

    let date = new Date(order.orderDate);
    let day = date.getDate();
    let month = date.toLocaleString("default", {month: "long"});
    let year = date.getFullYear();
    let currentDate = `${day} ${month}, ${year}`; // Formats the date in Day Month, Year format.

    let price = order.totalAmount.toFixed(2);
    let name = `${order.user.firstName} ${order.user.lastName}`;

    let summaryElement = ["Order Placed", "Total", "Ship To"];
    let summaryContent = [currentDate, `$${price}`, name];

    // Creates elements for each summary detail and appends them to the container.
    summaryElement.forEach((element, i) => {
      let container = gen("div");
      let firstElement = gen("h2");
      firstElement.textContent = element;
      let secondElement = gen("p");
      secondElement.textContent = summaryContent[i];
      container.appendChild(firstElement);
      container.appendChild(secondElement);
      outerContainer.appendChild(container);
    });

    return outerContainer;
  }

  /**
   * Constructs the detailed view of the order, such as delivery date and item details.
   * @param {Object} order - The order data object.
   * @return {HTMLElement} The container element with detailed order information.
   */
  function createOrderDetails(order) {
    let outerContainer = gen("div");
    outerContainer.classList.add("order-details");

    let deliverDate = gen("h2");
    deliverDate.textContent = `Expected Delivery Date: ${order.shipping.deliveryDate}`;

    outerContainer.appendChild(deliverDate);

    order.items.forEach((item) => {
      let container = gen("div");
      container.classList.add("order-item");

      let image = gen("img");
      image.src = GOOD_READS_IMG_URL + item.image; // Prepend GOOD_READS_IMG_URL to the image URL
      image.alt = item.description; // Use item description as alt text

      let bookDescription = gen("span");
      bookDescription.textContent = item.description;

      container.appendChild(image);
      container.appendChild(bookDescription);
      outerContainer.appendChild(container);
    });

    return outerContainer;
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
   * Returns first element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Generates a new DOM object of the given HTML tag and returns it.
   * @param {string} tag - HTML tag
   * @returns {object} - DOM object generated.
   */
  function gen(tag) {
    return document.createElement(tag);
  }
})();
