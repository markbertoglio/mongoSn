var mongodb = require('mongodb');
var http = require('http');

module.exports = MongoSn;

function MongoSn(ssApiHost, ssApiPort) {
  this.ssApiHost = ssApiHost;
  this.ssApiPort = ssApiPort;
}
  
MongoSn.prototype.userMongoSnConnection = function(email, password, done) {
  var creds = {
    email: email,
    password: password
  };
  var self = this;

  doPost(self.ssApiHost, self.ssApiPort, '/api/1.0/unauth/login-user', creds, onLogin);

  function onLogin(err, result) {
    if (err) return done(err);
    if (!result.result || !result.result.sessionToken) 
      return done("login failed");
    doPost(self.ssApiHost, self.ssApiPort, '/api/1.0/get-service-endpoint', {serviceName: 'mongodb'}, 
           result.result.sessionToken, onGetServiceEndpoint);
  }

  function onGetServiceEndpoint(err, result) {
    if (err) return done(err);
    if (!result || !result.result) return done("missing result");
    var dbInfo = result.result;
    var mongoUrl = "mongodb://" + (dbInfo.v4 || dbInfo.v6) + ":" + dbInfo.port + "/" + dbInfo.mongoDb + "?maxPoolSize=1";
    mongodb.connect(mongoUrl, onMongoConnect);

    function onMongoConnect(err, db) {
      if (err) return done(err);
      var adminDb = db.admin();
      adminDb.authenticate(dbInfo.mongoUser, dbInfo.mongoPassword, 
                           function(err, result) {
        if (err) {
          db.close();
          return done(err);
        }
        return done(null, db);
      });
    }
  }
}

MongoSn.prototype.adminMongoSnConnection = function(adminEmail, adminPassword, userEmail, done) {
  var creds = {
    email: adminEmail,
    password: adminPassword
  };
  var self = this;
  
  doPost(self.ssApiHost, self.ssApiPort, '/api/1.0/unauth/login-user', creds, onLogin);

  function onLogin(err, result) {
    if (err) return done(err);
    if (!result.result || !result.result.sessionToken) 
      return done("login failed");
    doPost(self.ssApiHost, self.ssApiPort, '/api/1.0/admin/get-service-endpoint', 
           {serviceName: 'mongodb', email: userEmail}, 
           result.result.sessionToken, onGetServiceEndpoint);
  }

  function onGetServiceEndpoint(err, result) {
    if (err) return done(err);
    if (!result || !result.result) return done("missing result");
    var dbInfo = result.result;
    var mongoUrl = "mongodb://" + (dbInfo.v4 || dbInfo.v6) + ":" + dbInfo.port + "/" + dbInfo.mongoDb + "?maxPoolSize=1";
    mongodb.connect(mongoUrl, onMongoConnect);

    function onMongoConnect(err, db) {
      if (err) return done(err);
      var adminDb = db.admin();
      adminDb.authenticate(dbInfo.mongoUser, dbInfo.mongoPassword, 
                           function(err, result) {
        if (err) {
          db.close();
          return done(err);
        }
        return done(null, db);
      });
    }
  }
}


function doPost(host, port, path, body, session, done) {

  if (typeof session == 'function') {
    done = session;
    session = null;
  }
  var bodyStr = JSON.stringify(body);

  var headers = {
    'Content-Type': 'application/json',
    'Content-Length': bodyStr.length
  };

  if (session) headers['session-token'] = session; 

  var options = {
    host: host,
    port: port,
    path: path,
    method: 'POST',
    headers: headers
  };

  // Setup the request.  The options parameter is
  // the object we defined above.
  var req = http.request(options, function(res) {
    res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      var resultObject = JSON.parse(responseString);
      done(null, resultObject);
    });
  });

  req.on('error', function(e) {
    done(e);
  });

  req.write(bodyStr);
  req.end();
}
