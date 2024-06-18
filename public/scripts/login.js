/*
 * Name: Suhani Arora + Oscar Wang
 * Date: May 5, 2024
 * Section: CSE 154 AD
 * TAs: Max Beard + Allan N Tran
 *
 * This is the JS to implement the UI the login page. Once the user enters credentials, and the
 * credentials are approved, it changes the view of the page to the home page of our website.
 */

"use strict";
(function() {
  const ERROR_MSG_TIME = 2000;
  window.addEventListener("load", init);

  /**
   * Executed on initialization of page. Checks if the user wanted to be remembered
   * on the browser.
   */
  function init() {
    let email = localStorage.getItem("email");
    if (email) {
      id("email").value = email;
      id("remember-me").checked = true;
    }
    id("login-form").addEventListener("submit", login);
  }

  /**
   * Logs and authenticates a user into the website. If authentication was successful,
   * user is led to the home page. If the authentication was unsuccessful, a message indicating so
   * is displayed to the user
   * @param {object} event - click event
   */
  function login(event) {
    event.preventDefault();
    let form = id("login-form");
    let userInfo = new FormData(form);
    fetch("/login", {method: "POST", body: userInfo})
      .then(statusCheck)
      .then(res => res.text())
      .then((res) => {
        window.location.href = "../index.html";
        if (id("remember-me").checked) {
          localStorage.setItem("email", res.split(":")[1].trim());
        } else {
          localStorage.clear();
        }
      })
      .catch(handleError);
  }

  /**
   * Checks the response status and throws an error if it"s not a successful response.
   * @param {Response} res - The fetch response to check.
   * @returns {Response} The response if successful.
   * @throws {Error} If response is not OK.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      let errorText = await res.text();
      let error = new Error(errorText);
      error.status = res.status; // Explicitly set the status code
      throw error;
    }
    return res;
  }

  /**
   * Handles errors by displaying an error message to the user.
   * @param {Error} error - The error to handle.
   */
  function handleError(error) {
    let footer = gen("footer");
    let errorP = gen("p");
    errorP.textContent = error;
    footer.appendChild(errorP);
    document.querySelector("body").appendChild(footer);
    setTimeout(() => {
      footer.remove();
    }, ERROR_MSG_TIME);
  }

  /**
   * Returns the element with the specified ID.
   * @param {string} id - The ID of the element to find.
   * @returns {Element} The DOM element with the specified ID.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Creates and returns a new element with the given tag name.
   * @param {string} tagName - The tag name for the new element.
   * @returns {Element} The newly created element.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
})();