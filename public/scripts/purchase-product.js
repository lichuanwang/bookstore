/**
 * Name: Oscar Wang
 * Date: May 05, 2024
 * Section: CSE 154 AD
 *
 * This is the JS to implement the checkout process
 */

"use strict";

/**
 * Sets up the page by adding event listeners and initializing dialog interactions.
 */
(function() {
  const LASTDIGITS = -4;
  window.addEventListener("load", init);

  const GOOD_READS_IMG_URL = "https://images.gr-assets.com/books/";

  /**
   * Initializes the dialogs for address, payment, and transaction changes.
   * Attaches event listeners to manage dialog interactions.
   */
  function init() {
    let addressDialog = id("address-dialog");
    let paymentDialog = id("payment-dialog");

    // Sets up the dialog for changing addresses.
    qs(".change-address").addEventListener("click", function() {
      let wrapper = qs("#address-dialog .wrapper");
      change(addressDialog, wrapper);
    });

    // Sets up the dialog for changing payment methods.
    qs(".change-payment").addEventListener("click", function() {
      let wrapper = qs("#payment-dialog .wrapper");
      change(paymentDialog, wrapper);
    });

    // Listeners for form submissions that record new information.
    id("address-form").addEventListener("submit", recordNewAddress);
    id("payment-form").addEventListener("submit", recordNewPayment);

    createItem();

    // Sets up the dialog for processing a transaction.
  }

  /*
   * Creates a new item element and appends it to the shopping cart.
   */
  async function createItem() {
    let data = await getCartInfo();
    displayCart(data);
    getSubTotal(data);
  }

  async function getSubTotal(data) {
    let total = 0;
    let totalQuantity = 0;

    if (data.length) {
      data.forEach((element) => {
        total += element.price * element.quantity;
        totalQuantity += element.quantity;
      });
    }

    let orderSummary = qs(".summary");
    orderSummary.innerHTML = "";
    let orderSummaryTitle = gen("h2");
    orderSummaryTitle.textContent = "Order Summary";
    let line1 = gen("hr");

    let item = gen("div");
    let titleItem = gen("p");
    titleItem.textContent = `Items (${totalQuantity}):`;
    let subTotal = gen("p");
    subTotal.textContent = `$${total}`;
    item.appendChild(titleItem);
    item.appendChild(subTotal);

    let shipping = gen("div");
    let titleShipping = gen("p");
    titleShipping.textContent = `Shipping & Handling:`;
    let shippingFee = gen("p");
    shippingFee.id = "shipping-fee";
    let shippingMethod = "standard";
    let allItems = qsa("input[type='radio']");
    allItems.forEach((element) => {
      if (element.checked && element.value === "express") {
        shippingMethod = "express";
      }
    });
    let fee = 0;
    if (shippingMethod === "express") {
      fee = 6.99;
    }
    shippingFee.textContent = `$${fee}`;
    shipping.appendChild(titleShipping);
    shipping.appendChild(shippingFee);

    let beforeTax = gen("div");
    let beforeTaxTitle = gen("p");
    beforeTaxTitle.textContent = `Total before tax:`;
    let beforeTaxTotal = gen("p");
    beforeTaxTotal.textContent = `$${total}`;
    beforeTax.appendChild(titleShipping);
    beforeTax.appendChild(shippingFee);

    let eastimateTax = gen("div");
    let eastimateTaxTitle = gen("p");
    eastimateTaxTitle.textContent = `Estimated tax:`;
    let eastimateTaxTotal = gen("p");
    let tax = total * 0.1;
    let roundTaxTitle = (Math.floor(tax * 100) / 100).toFixed(2);
    eastimateTaxTotal.textContent = `$${roundTaxTitle}`;
    eastimateTax.appendChild(eastimateTaxTitle);
    eastimateTax.appendChild(eastimateTaxTotal);

    let line2 = gen("hr");

    let orderTotal = gen("h2");
    orderTotal.textContent = `Order Total: $${(total + fee + tax).toFixed(2)}`;

    let orderBtn = gen("button");
    orderBtn.id = "place-order";
    orderBtn.textContent = "Place your order";
    orderBtn.addEventListener("click", placeOrder);

    let transDialog = gen("dialog");
    transDialog.id = "transaction-dialog";
    let wrapper = gen("div");
    wrapper.className = "wrapper";
    let img = gen("img");
    img.src = "../img/fail.jpeg";
    img.alt = "failed";
    let result = gen("h2");
    result.textContent = "Failed";
    let confirmationNumber = gen("p");

    orderBtn.addEventListener("click", function () {
      change(transDialog, wrapper);
    });

    wrapper.appendChild(img);
    wrapper.appendChild(result);
    wrapper.appendChild(confirmationNumber);
    transDialog.appendChild(wrapper);

    orderSummary.appendChild(orderSummaryTitle);
    orderSummary.appendChild(line1);
    orderSummary.appendChild(item);
    orderSummary.appendChild(shipping);
    orderSummary.appendChild(beforeTax);
    orderSummary.appendChild(eastimateTax);
    orderSummary.appendChild(line2);
    orderSummary.appendChild(orderTotal);
    orderSummary.appendChild(orderBtn);
    orderSummary.appendChild(transDialog);
  }

  async function placeOrder() {
    try {
      let sessionToken = getCookieValue("session_token");
      let shippingAddress = localStorage.getItem("shippingAddress");
      let cardNumber = sessionStorage.getItem("card_number");
      let shippingMethod = "standard";

      let allItems = qsa("input[type='radio']");
      allItems.forEach((element) => {
        if (element.checked && element.value === "express") {
          shippingMethod = "express";
        }
      });

      let params = {
        session_token: sessionToken,
        shipping_address: shippingAddress,
        shipping_method: shippingMethod,
      };

      let response = await fetch("/order/placed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      await statusCheck(response);

      let result = await response.json();
      let confirmationNumber = result.confirmationNumber;
      console.log(confirmationNumber);
      qs(".wrapper img").src = "../img/success.png";
      qs(".wrapper h2").textContent = "Your order is placed successfully";
      qs(
        ".wrapper p"
      ).textContent = `Confirmation & Tracking Number: ${confirmationNumber}`;
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 3000);
    } catch (error) {
      console.log(error);
    }
  }

  function displayCart(data) {
    let itemsReviewSection = qs(".items-review");
    itemsReviewSection.innerHTML = "";

    let title = gen("h2");
    title.textContent = "Review Items and Shipping";
    itemsReviewSection.appendChild(title);

    if (data.length) {
      data.forEach((element) => {
        let itemDiv = gen("div");
        itemDiv.className = "item";

        // Append the img, description, and price elements to the item div.
        itemDiv.appendChild(createImage(element));
        itemDiv.appendChild(createItemDescription(element));
        itemDiv.appendChild(createDelivery(element));

        // Append the fully constructed item div to the shopping cart.
        itemsReviewSection.appendChild(itemDiv);
      });
    }
  }

  /*
   * Creates an image element for an item.
   * @return {HTMLImageElement} The image element configured for the item.
   */
  function createImage(data) {
    let img = gen("img");
    img.src = GOOD_READS_IMG_URL + data.image;
    img.alt = data.title;
    return img;
  }

  /*
   * Constructs the description section of an item, including title and delivery information.
   * @return {HTMLElement} The item description element.
   */
  function createItemDescription(data) {
    let itemDescription = gen("div");
    itemDescription.className = "item-description";

    let title = gen("h3");
    title.textContent = data.title;
    itemDescription.appendChild(title);

    let deliveryDate = gen("p");
    deliveryDate.id = `${data.book_id}-delivery-date`;
    const currentDate = new Date();
    const futureDate = addDays(currentDate, 3);
    const formattedDate = formatDate(futureDate);

    deliveryDate.textContent = formattedDate;
    itemDescription.appendChild(deliveryDate);

    // Append a quantity selector to the item description.
    itemDescription.appendChild(createQuantitySelector(data));

    let priceTag = gen("p");
    let price = `$${data.price}`;
    priceTag.textContent = price;

    itemDescription.appendChild(priceTag);

    return itemDescription;
  }

  // Function to format date as "Fri, May 3"
  function formatDate(date) {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const dayName = daysOfWeek[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();

    return `${dayName}, ${monthName} ${day}`;
  }

  // Function to add days to a date
  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /*
   * Creates a quantity selector for an item, allowing users to choose how many to purchase.
   * @return {HTMLElement} The quantity selector div.
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
    select.addEventListener("change", async function () {
      await updateQuantity(data);
    });

    // Populate the select element with options for quantities.
    for (let i = 0; i <= 10; i++) {
      let option = gen("option");
      option.value = i;
      option.textContent = i === 0 ? "0 (Delete)" : i;
      if (i === data.quantity) option.selected = true;
      select.appendChild(option);
    }

    quantityDiv.appendChild(select);
    return quantityDiv;
  }

  async function updateQuantity(data) {
    try {
      let quantity = id(data.book_id).value;

      let bookId = data.book_id;
      let session_token = getCookieValue("session_token");
      let params = {
        bookId: bookId,
        session_token: session_token,
        quantity: parseInt(quantity),
      };

      let response = await fetch("/quantity/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      await statusCheck(response);
      console.log(await response.text());

      data = await getCartInfo();
      displayCart(data);
      getSubTotal(data);
    } catch (error) {}
  }

  /*
   * Creates and returns a price element for an item.
   * @return {HTMLParagraphElement} The paragraph element displaying the price.
   */
  function createDelivery(data) {
    let delivery = gen("div");
    delivery.classList.add("delivery");
    delivery.id = data.book_id;

    let title = gen("h3");
    title.textContent = "Choose Delivery Option";
    delivery.appendChild(title);

    let option1 = gen("div");

    let input1 = gen("input");
    input1.type = "radio";
    input1.name = `${data.book_id}-deliver-option`;
    input1.id = `${data.book_id}-express`;
    input1.value = "express";
    input1.addEventListener("change", function () {
      id("shipping-fee").textContent = `$6.99`;
    })

    let label1 = gen("label");
    label1.htmlFor = `${data.book_id}-express`;
    label1.textContent = "Express";

    option1.appendChild(input1);
    option1.appendChild(label1);

    let option2 = gen("div");
    let input2 = gen("input");
    input2.type = "radio";
    input2.name = `${data.book_id}-deliver-option`;
    input2.id = `${data.book_id}-standard`;
    input2.value = "standard";
    input2.checked = true;
    input2.addEventListener("change", function () {
      id("shipping-fee").textContent = `$0`;
    })

    let label2 = gen("label");
    label2.htmlFor = `${data.book_id}-standard`;
    label2.textContent = "Standard";

    option2.appendChild(input2);
    option2.appendChild(label2);

    delivery.appendChild(option1);
    delivery.appendChild(option2);

    input1.addEventListener("change", function () {
      let date = changeDeliveryDate(2);
      id(`${data.book_id}-delivery-date`).textContent = date;
    });

    input2.addEventListener("change", function () {
      let date = changeDeliveryDate(5);
      id(`${data.book_id}-delivery-date`).textContent = date;
    });

    return delivery;
  }

  function changeDeliveryDate(day) {
    const currentDate = new Date();
    const futureDate = addDays(currentDate, day);
    const formattedDate = formatDate(futureDate);
    return formattedDate;
  }

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
   *
   * @returns
   */
  async function getCartInfo() {
    try {
      let session_token = getCookieValue("session_token");
      let response = await fetch(`/cart?session_token=${session_token}`);
      await statusCheck(response);
      let data = await response.json();
      data = data.cart;
      return data;
    } catch (error) {}
  }

  /**
   * Displays the specified dialog for interaction.
   * Closes the dialog if a click occurs outside of the dialog content wrapper.
   * @param {HTMLDialogElement} dialog - The dialog element to display.
   * @param {Element} wrapper - The container within the dialog that
   * should not trigger a close when clicked.
   */
  function change(dialog, wrapper) {
    dialog.showModal();
    dialog.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        dialog.close();
      }
    });
  }

  /**
   * Prevents default form submission and records a new address from the form.
   * Updates the displayed address information on the page.
   * @param {Event} event - The form submission event.
   */
  function recordNewAddress(event) {
    event.preventDefault();
    let form = id("address-form");
    let newAddress = new FormData(form);
    let info = [
      newAddress.get("name"),
      newAddress.get("street"),
      newAddress.get("apt-num"),
      `${newAddress.get("city")}, ${newAddress.get("state")} ${newAddress.get(
        "zipcode"
      )}`,
    ];

    let pTags = qsa(".shipping div p");
    pTags.forEach((paragraph, i) => (paragraph.textContent = info[i]));

    // Join the info array into a single string
    let addressString = info.slice(1).join(", ");

    // Store the string in localStorage
    localStorage.setItem("shippingAddress", addressString);
    form.reset();
    id("address-dialog").close();
  }

  /**
   * Prevents default form submission and records a new payment method.
   * Displays the last four digits of the new card number on the page.
   * @param {Event} event - The form submission event.
   */
  function recordNewPayment(event) {
    event.preventDefault();
    let form = id("payment-form");
    let newPayment = new FormData(form);
    let cardNumber = newPayment.get("card-number");
    let lastFourDigits = cardNumber.slice(LASTDIGITS);

    let pTag = qs(".payment div p");
    pTag.textContent = `Paying with card ending in ${lastFourDigits}`;
    sessionStorage.setItem("card_number", lastFourDigits);
    form.reset();
    id("payment-dialog").close();
  }

  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Queries the document for the first element matching the selector.
   * @param {string} selector - The selector string.
   * @return {Element} The first matching element.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /*
   * Creates a new HTML element with the specified tag name.
   * @param {string} tagName - The tag name for the element to create.
   * @return {Element} The newly created element.
   */

  function gen(tagName) {
    return document.createElement(tagName);
  }

  /**
   * Queries the document for all elements matching the selector.
   * @param {string} selector - The selector string.
   * @return {NodeList} A NodeList of all matching elements.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
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
