class RequestFactory
{
  constructor() 
  {
    this.tiposPermitidos = ["Mensaje", "Cancion", "Voto", "Notificacion"];
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
    console.log(this.validateMessage(message));
    if (this.validateMessage(message))
    {
        if (message.tipo == "Cancion")
        {
            return new Request(message.tipo, origen, new Cancion(message.link, 0));
        }
        else if (message.tipo == "Mensaje") 
        {
            return new Request(message.tipo, origen, null)
        }
        else if (message.tipo == "Voto") 
        {
            return new Request(message.tipo, origen, new Voto(message.link, message.value, origen))
        }
        else if (message.tipo == "Notificacion") 
        {
            return new Request(message.tipo, origen, null)
        }
    }

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
 
function originIsAllowed(origin) {
  return true;
}
 
var serverRequestFactory = new RequestFactory();

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' ' + request.origin + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);

            incomingRequest = serverRequestFactory.createRequest(JSON.parse(message.utf8Data), request.origin);

            if (incomingRequest.tipo == "Mensaje")
            {
                connection.sendUTF(JSON.stringify(incomingRequest));
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
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
