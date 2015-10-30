class RequestFactory
{
  constructor() 
  {
    this.tiposPermitidos = ["Mensaje", "Cancion", "Voto", "Notificacion", "Participantes"];
    this.codesPermitidos = ["Voto", "CancionEnd"];
  }

  validateMessage(message)
  {
    if ((this.tiposPermitidos.indexOf(message.tipo) !== -1)) 
    {
        if (message.tipo == "Notificacion")
            if (this.codesPermitidos.indexOf(message.code) !== -1)
                return true;
            else
                return false;

        return true;
    }
    else
        return false;
  }

  createRequest(message, origen)
  {
    if (this.validateMessage(message))
    {
        if (message.tipo == "Cancion")
        {
            return new Request(message.tipo, origen, new Cancion(message.link, 0));
        }
        else if (message.tipo == "Mensaje") 
        {
            return new Request(message.tipo, origen, new Mensaje(message.data, message.username, origen, Math.floor((new Date().getTime()) / 1000)));
        }
        else if (message.tipo == "Voto") 
        {
            return new Request(message.tipo, origen, new Voto(message.link, message.value, origen))
        }
        else if (message.tipo == "Participantes") 
        {
            return new Request(message.tipo, origen, message.data)
        }
        else if (message.tipo == "Notificacion") 
        {
            return new Request(message.tipo, origen, null)
        }
    }

  }

}

class Mensaje
{
  constructor(data, username, origen, time) 
  {
    this.origen = origen;
    this.data = data;

    for (var i = connections.length - 1; i >= 0; i--) {
      if (connections[i].address == origen) {
        this.username = connections[i].username;
      }
    };

    if (typeof(this.username) === 'undefined')
      this.username = username;

    this.time = time;
  }
}


class Request
{
  constructor(tipo, origen, data) 
  {
    this.tipo = tipo;
    this.origen = origen;
    this.data = data;
  }
}

class Voto
{
    constructor(link, value, votante)
    {
        this.votante = votante;
        this.link = link;
        this.value = value;
    }
}

class Cancion 
{
    constructor(link, value)
    {
        this.votantes = [];
        this.link = link;
        this.value = value;
    }

    castVote(voto)
    {
        if (this.votantes.indexOf(voto.votante) === -1) 
        {
            if (value > 0)
                this.value++;
            else
                this.value--;

            this.votantes.push(voto.votante);
            return true;
        }
        else
            return false;
    }
}

class Playlist 
{
  constructor(max) 
  {
    this.canciones = [];
    this.maxCanciones = max;

    this.lookup = {};
  }

  addCancion(cancion) 
  {
    if (this.canciones.length < this.maxCanciones) {
        this.canciones.push(cancion);
        this.lookup[cancion.link] = this.listaCanciones.indexOf(cancion);
        return true;
    } else
    {
        return false;
    }
  }

  castVote(voto) 
  {
    var cancion = this.lookup.indexOf(request.link);

    if (cancion !== -1)
    {
        cancion.castVote(request);
        return true;
    }
    else 
    {
        return false;
    }
  }

  process()
  {
    this.listaCanciones = this.listaCanciones[0].concat(this.listaCanciones.slice(1).sort(function(a,b) {return (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0);}));
    return this.listaCanciones;
  }

  next()
  {
    this.listaCanciones = this.listaCanciones.slice(1);
    return this.listaCanciones;
  }

  current()
  {
    return this.listaCanciones;
  }
}

var WebSocketServer = require('websocket').server;
var http = require('http');
 
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
 
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
}); 
 
var clients = [];
var serverRequestFactory = new RequestFactory();
var connections = [];

function originIsAllowed(remoteAddress) {
  if (clients.indexOf(remoteAddress) == -1) {
    clients.push(remoteAddress);
    return true;
  }
  else
    return false;
}

wsServer.on('request', function(request) {

    remoteAddress = request.remoteAddress.slice(7);

    if (!originIsAllowed(remoteAddress)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + remoteAddress + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', remoteAddress);

    connections.push({connection: connection, address: remoteAddress});

    console.log((new Date()) + ' ' + remoteAddress + ' Connection accepted.');

    connection.on('message', function(message) {

        for (var i = connections.length - 1; i >= 0; i--) {
          if (connections[i].connection == this)
            var connData = connections[i];
        };

        
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);

            rawMessage = JSON.parse(message.utf8Data);
            incomingRequest = serverRequestFactory.createRequest(rawMessage, connData.address);

            if (incomingRequest.tipo == "Mensaje")
            { 
                if (typeof(connData.username) === 'undefined'){
                  connData['username'] = rawMessage.username;

                  var rawParticipantesData = [];
                  for (var i = connections.length - 1; i >= 0; i--) {
                    rawParticipantesData.push({username: connections[i].username, address: connections[i].address}) 
                  };

                  otherRequest = serverRequestFactory.createRequest({tipo: "Participantes" , data: rawParticipantesData}, connData.address);

                  for (var i = connections.length - 1; i >= 0; i--) {
                      console.log('Sending Message: ' + JSON.stringify(otherRequest));
                      connections[i].connection.sendUTF(JSON.stringify(otherRequest));
                  };
                }

                for (var i = connections.length - 1; i >= 0; i--) {
                    console.log('Sending Message: ' + JSON.stringify(incomingRequest));
                    connections[i].connection.sendUTF(JSON.stringify(incomingRequest));
                };
            }
            else 
            {
                if (incomingRequest.tipo == "Cancion") 
                {
                    Playlist.addCancion(incomingRequest.data);
                } 
                else if (incomingRequest.tipo == "Voto") 
                {
                    Playlist.castVote(incomingRequest.data);
                } 
                else if (incomingRequest.tipo == "Notificacion") 
                {
                    Playlist.processNotification(incomingRequest);
                } 

                connection.sendUTF(Playlist.Current());
            }

        }       
    });
    connection.on('close', function(reasonCode, description) {
        if (clients.indexOf(remoteAddress) !== -1) 
        {
          clients.splice(clients.indexOf(remoteAddress), 1);
          
          for (var i = connections.length - 1; i >= 0; i--) {
            if (connections[i].connection == this)
              connections.splice(i,1);
          };

        }

        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
