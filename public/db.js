let db;
// create a new db request for a "budget" indexdb database.
const request = window.indexedDB.open("budget", 1);

// Checking if the db needs an update and creating the object stores
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  // create object store called "pending" and set autoIncrement to true
  db.createObjectStore("pending", {autoIncrement: true} ); 

};

// On a successful request...
request.onsuccess = function (event) {
  db = event.target.result;

  // Checking if the browser is online if true checkDatabase
  if (navigator.onLine) {
    checkDatabase();
  }
};

// If their is an error console.log the error code.
request.onerror = function (event) {
  // log error here
  console.log("got an error ", event.target.errorCode)
};

// Saving the api call in the db in case if the browser is offline.
function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite")
  // access your pending object store
  const pendingStore = transaction.objectStore("pending");
  // add record to your store with add method.
  pendingStore.add(record);
}

// Checking the db
function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite")
  // access your pending object store
  const pendingStore = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = pendingStore.getAll();

  // getting all the stored requests 
  getAll.onsuccess = function () {
      // if greater than 0...
    if (getAll.result.length > 0) {
        // Making an api post call to update the mongodb then clearing the indexDB
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(["pending"], "readwrite")
          // access your pending object store
          const pendingStore = transaction.objectStore("pending");
          // clear all items in your store
          pendingStore.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
