var tls = require('tls');
var fs = require('fs');

var options = {
  key: fs.readFileSync('/etc/openvpn/easy-rsa/keys/clarke.key'),
  cert: fs.readFileSync('/etc/openvpn/easy-rsa/keys/clarke.crt'),

  // This is necessary only if using the client certificate authentication.
  requestCert: true,

  // This is necessary only if the client uses the self-signed certificate.
  ca: [ fs.readFileSync('/etc/openvpn/easy-rsa/keys/ca.crt') ]
};

var server = tls.createServer(options, function(cleartextStream) {
  console.log(cleartextStream.remoteAddress, " ",
              cleartextStream.authorized ? 'authorized' : 'unauthorized');
  cleartextStream.write("welcome!\n");
  cleartextStream.setEncoding('utf8');
  cleartextStream.pipe(cleartextStream);
});

server.listen(9999, function() {
  console.log('server bound');
});
