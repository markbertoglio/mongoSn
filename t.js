var MS = require('./mongosn');
var ms = new MS('127.0.0.1', 9004);

ms.loginUser('bv@sirro.net', 'password1', function(err, sessionToken) {
	if (err) return console.log(err);
	ms.getMailboxes(sessionToken, function(err, result) {
		if (err) return console.log("get-mailboxes", err);
		var mailboxes = result.result.data;
		ms.createMailbox(sessionToken, "DelChild2", mailboxes[1]._id, function(err, result) {
			console.log(JSON.stringify(result, null, 2));
		});
	});
});
