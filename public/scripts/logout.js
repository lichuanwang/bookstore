/**
 * Name: Suhani Arora + Oscar Wang
 * Date: May 5, 2024
 * Section: CSE 154 AD
 * TAs: Max Beard + Allan N Tran
 *
 * This script controls the logout functionality of our website. When the logout button from any
 * page is clicked, it will successfully log the user out.
 */

"use strict";
(function() {
  const ERROR_MSG_TIME = 2000;
  window.addEventListener("load", init);

  /**
   * Executed on initialization of page. If user is logged out successfully, they can simply
   * navigate the home page and items but cannot do other things.
   */
  function init() {
    let path = window.location.href.split("/");
    if (!getCookieValue("session_token") && path[path.length - 1] !== "index.html") {
      window.location.href = "../index.html";
    } else {
      document.getElementById("logout").addEventListener("click", logout);
    }
  }

  /**
   * Logs user out of the system and browser. In case anything goes wrong, an error message
   * is displayed.
   */
  function logout() {
    fetch("/logout", {method: "POST"})
      .then(statusCheck)
      .then(() => {
        window.location.href = "../index.html";
      })
      .catch(handleError);
  }

  /**
   * Handles errors by displaying an error message to the user.
   * @param {Error} error - The error to handle.
   */
  function handleError(error) {
    let footer = document.createElement("footer");
    let errorP = document.createElement("p");
    errorP.textContent = error;
    footer.appendChild(errorP);
    document.querySelector("body").appendChild(footer);
    setTimeout(() => {
      footer.remove();
    }, ERROR_MSG_TIME);
  }

  /**
   * Helper function for getting the cookie given the name of the cookie
   * @param {string} key - cookie key
   * @return {string} - returns the value of the cookie
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
})();