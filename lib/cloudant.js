var Cloudant = require('cloudant');
var mydb;

class CloudantDB {

  /**
   * create DB named 'Products, in Cloudant, based on the env variable
   * CLOUDANT_URL, if it doesn't exist
   */
  createDB() {
    return new Promise(function (resolve, reject) {
      var cloudantURL = '';
      var cloudant = Cloudant(cloudantURL, function (er, cloudant, reply) {
        if (er) {
          reject(er);
        }
        console.log('Connected with username: %s', reply.userCtx.name);
      });
  
      // Create a database 'products' if it doesn't exist
      cloudant.db.list(function (err, dbs) {
        if (!dbs.includes('products')) {
          console.log('Creating products database');
  
          cloudant.db.create('products', function () {
            mydb = cloudant.db.use('products');
            resolve(mydb);
          });
        }
        //use existing db if one exists
        else {
          mydb = cloudant.db.use('products');
          resolve(mydb);
        }
      });
    });
      
    

  }

  /**
* Update a Cloudant Document with the nlu results
* @param {Object} nluResult - JSON to be saved in Cloudant
* @param {String} reviewId - reviewId of the product;
* @return {Promise} - promise that is resolved when cloudant document is saved
*/
  insertNLUInCloudant(nluResult, reviewId) {
    return new Promise(function (resolve) {
      var cloudant = new CloudantDB();
      cloudant.getCloudantReviews(reviewId)
        .then(function (options) {
          var doc = options;
          doc.watsonResults = nluResult;
          cloudant.insertCloudantDoc(doc)
            .then(resolve);
        });
    });
  }

  /**
 * Check if Cloudant Document already exists
 * @param {String} productId - product ID of Amazon Product found in URL
 * @return {Promise} - promise that is resolved when cloudant returns
 * a result.
 * Boolean is resolved
 */
  existingCloudantDoc(productId) {
    return new Promise(function (resolve, reject) {
      console.log('mydb: ');
      console.log(mydb);
      mydb.find({ selector: { _id: productId } }, function (error, result) {
        if (error) {
          reject(error);
        }
        else {
          resolve(result.docs.length > 0);
        }
      });
    });
  }

  /**
   * Check if number of reviews in cloudant document is equal to scraped number
   * @param {Object} options - contains the product ID and scraped number
   * options = {
   * "productId":"B0123"
   * "numberOfReviews": 23
   * }
   * @return {Promise} - promise that is resolved when cloudant returns
   * a result.
   * object resolved:
   * object = {
   * "isEqual": true,
   * "isReviewsEqualToDiscoveryDocuments": true
   * "_rev": ""
   * }
   * object.isEqualToScrape is a Boolean
   * object.isReviewsEqualToDiscoveryDocuments is Boolean
   */
  isNumberOfReviewsEqual(options) {
    return new Promise(function (resolve, reject) {
      mydb.find({ selector: { _id: options.productId } }, function (error, result) {
        if (error) {
          reject(error);
        }
        else {
          var object = {};
          object.isEqualToScrape = result.docs[0].reviews.length == options.numberOfReviews;
          object._rev = result.docs[0]._rev;
          object.CloudReviewsLen = result.docs[0].reviews.length;
          if (result.docs[0].hasOwnProperty('watsonDiscovery')) {
            object.isReviewsEqualToDiscoveryDocuments = object.CloudReviewsLen == result.docs[0].watsonDiscovery.matching_results;
          }
          else {
            object.isReviewsEqualToDiscoveryDocuments = false;
          }
          console.log(object._rev);
          console.log(result.docs[0].reviews.length + ' in cloudant. ' + options.numberOfReviews + ' in scraping');
          resolve(object);
        }
      });
    });
  }

  /**
   * Inserting or Updating a Cloudant Document
   * @param {Object} doc - JSON to be saved in Cloudant
   * add _rev in {Object} doc for updating
   * @return {Promise} - promise that is resolved when cloudant document is saved
   */
  insertCloudantDoc(doc) {
    return new Promise(function (resolve, reject) {
      console.log('mydb: ');
      // console.log(mydb);
      mydb.insert(doc, function (error, result) {
        if (error) {
          console.log(error);
          // reject('insertCloudantDoc Err');
          // console.log(error);
        }
        // console.log(result);
        resolve(result);
      });
    });
  }

  /**
 * Getting the document in Cloudant
 * @param {String} productId - product ID of Amazon Product found in URL
 * @return {Promise} - promise that is resolved when cloudant returns
 * a result
 * object resolved:
 * object = {
 * "_id":"B01M718E9X",
 * "productName":"Coffee Maker",
 * "reviews": [{"reviewer": "", "authorLink": "", "text": ""}]
 * }
 */
  getCloudantReviews(productId) {
    return new Promise(function (resolve, reject) {
      console.log('inside get cloudant reviews');
      mydb.find({ selector: { _id: productId } }, function (error, result) {
        if (error) {
          console.log('err from mydb.find');
          console.log(error);
          reject(error);
        }
        else {
          // console.log(result)
          var object = result.docs[0];
          resolve(object);
        }
      });
    });
  }
}

module.exports = CloudantDB;

