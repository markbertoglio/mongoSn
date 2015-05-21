var MS = require('./mongosn');
var ms = new MS('127.0.0.1', 9004);

ms.loginUser('bv@sirro.net', 'password1', function(err, sessionToken) {
	if (err) return console.log(err);
	ms.getMailboxes(sessionToken, function(err, result) {
		if (err) return console.log("get-mailboxes", err);
		var mailboxes = result.data;
		ms.createMailbox(sessionToken, "susub3", "55577dd7bc82c5752cc36b4e", function(err, result) {
			if (err) return console.log("ERR", err);
			console.log("RESULT", JSON.stringify(result, null, 2));
		});
	});
});
