/*----------------------------------------------------------------------------------------------------------------
funcion que captura la ip del equipo y la guarda en la variable ip
----------------------------------------------------------------------------------------------------------------*/
var ip =function(){
    var os = require('os');
    var ifaces = os.networkInterfaces();
    try{
        if (os.platform() === 'darwin'){
            return ifaces.en1[1].address;
        } else{
            var alias = 0;
            var ip;
            Object.keys(ifaces).forEach(function(ifname){

                ifaces[ifname].forEach(function(iface){

                    if ('IPv4' !== iface.family || iface.internal !== false){
                        return;
                    }
                    if (alias==0){
                        ip = iface.address;
                    }
                     alias++;
                });
            });
            return ip;
        }
    }catch(err){
        console.log(err);
    }
}();
/*----------------------------------------------------------------------------------------------------------------
funcion que retorna los mensajes tipo json para mandar
----------------------------------------------------------------------------------------------------------------*/
var mensaje = function(codigo){
    var json;
    switch (codigo) {
        case 1:
            json = {codigo:1,
                    nombre:"servidor",
                    tiempo:120,
                    espacios: 4}
            break;
        case 3:
            json = {codigo:3,
                    aceptado:true,
                    direccion:ip_multi,
                    puerto:port_multi,
                    id:0}
            break;
        case 4:
            json = {codigo:4,
                    miembros:[]}
            break;
        case 5:
            json = {codigo:5,
                    x:0,
                    y:0,
                    tam:1,
                    color:"#000000"
                   }
            break;
        case 6:
            json = {codigo:6,
                    x:0,
                    tam:1,
                    y:0
                   }
            break;
        case 7:
            json = {codigo:7}
            break;
        case 10:
            json = {codigo:10,
                    mensaje:""}
            break;
        case 12:
            json = {codigo:12,
                    mensaje:""}
            break;
        case 14:
            json = {codigo:14,
                    mensaje:""}
            break;
    }
    return json;
}
/*----------------------------------------------------------------------------------------------------------------
                                            varibles de conexion
----------------------------------------------------------------------------------------------------------------*/
var dgram = require('dgram');
var net = require('net');
var message;
var ip_broadcast;
var ip_multi;
var port_udp;
var port_tcp;
var port_multi;
var json = mensaje(1);
var clients =[];
var Cnom=[];
var miembro={nombre:"",id:null};
var serverUDP;
var serverTCP;
var serverMUL;
var hilo;
var id=1;
var nombre;
var clientes = "";
var cascii="";
var Cifrado="";
var descifrado="";
var clave =20;
var ver  = "mensaje de verificacion de clientes se convierte en ascii y se realiza XOR con la clave del cliente...";


/*----------------------------------------------------------------------------------------------------------------
                                            funciones de conexion
----------------------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------------------
funcion encargada de leer la configuracion y ejecutar el TCP UDP y Multicast
----------------------------------------------------------------------------------------------------------------*/
function iniciar() {
    var fs = require('fs');
    fs.readFile('./dir/configuracion.txt', 'utf8', function(err, data) {
        if( err ){
            console.log(err)
        }
        else{
            res = data.split("-");
            ip_broadcast= res[0];
            ip_multi= res[1];
            port_udp= res[2];
            port_tcp= res[3];
            port_multi= res[4];
            console.log("Datos de conexion: "+"IB: "+ip_broadcast+" IM: "+ip_multi+" PU: "+port_udp+" PT: "+port_tcp+" PM: "+port_multi);
            json.nombre=nombre;
            UDP(json,ip_broadcast,port_udp);
            TCP(mensaje(3),ip,port_tcp);
            Multicast(ip_multi,port_multi);

      }
    });
}
/*----------------------------------------------------------------------------------------------------------------
funcion encargada de mandar el broacast y escuchar por UDP recibe el mensaje que recibe
es para mandar la presentacion del servidor, la ip de bradcast y el puerto UDP
----------------------------------------------------------------------------------------------------------------*/
function UDP(json,ip_broadcast,port){
    serverUDP = dgram.createSocket("udp4");
    serverUDP.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    serverUDP.close();
    });
    serverUDP.bind(function(){
        serverUDP.setBroadcast(true);
    });
    hilo =setInterval(function(){
            json.tiempo=""+json.tiempo;
            json.espacios=""+(1-clients.length);
            message = new Buffer(JSON.stringify(json));
            console.log(json.nombre+" "+json.tiempo+" "+json.espacios);
            serverUDP.send(message, 0, message.length, port, ip_broadcast, function(err, bytes) {
            if(err){console.log(err);}});
        json.tiempo=json.tiempo-1;
        if(json.espacios==0){
          enviar_empezar();
        }
        if(json.tiempo==0){
            json.tiempo=120;
        }
    },1000);
}
/*----------------------------------------------------------------------------------------------------------------
funcion encargada de mandar el TCP y escuchar por TCP recibe, el json corresponde al mensaje de acepacion la
ip del cliente y el puerto TCP para asi crear el socket con ese cliente y mandar mensajes mas adelante
----------------------------------------------------------------------------------------------------------------*/
function TCP(json,ip,port_tcp){
    serverTCP = net.createServer(function(socket) {

    console.log('client connected');
    socket.name = socket.remoteAddress;
    clients.push(socket);
    socket.on('error', (e) => {
            /*Llamar aqui la funcion que quita el cliente de los vectores
                la ip del cliente q se desconecta esta guarda en socket.name
            */
            console.log("Se desconecto "+socket.name);
     });
    socket.on('end', () => {
        console.log('client disconnected');
    });

    socket.on('data', (data) => {
        var recibido = JSON.parse(data);
        console.log("llego por TCP.......");
        console.log(recibido);
        switch (recibido.codigo) {
            case 2:
                var j={nombre:"",id:null}
                j.nombre=recibido.nombre;
                j.id=id;
                id++;
                Cnom.push(j);
                var lista = document.getElementById("lista");
                var lista_item = document.createElement("div");
                lista_item.className = "list-group-item";
                lista_item.innerHTML = recibido.nombre +" Ip:"+ socket.name;
                lista.appendChild(lista_item);
            break;
        }
    });
    json.id=id;
    socket.write(JSON.stringify(json));
    });
    serverTCP.listen(port_tcp,ip, () => {
    console.log('server escuchando');
    });
}
/*----------------------------------------------------------------------------------------------------------------
funcion encargada de escuchar por Multicast recibe la ip de multicast y el puerto milticast
----------------------------------------------------------------------------------------------------------------*/
function Multicast(ip_multi,port_multi){

  var dgram2 = require('dgram');
  clientMUL = dgram2.createSocket('udp4');

  clientMUL.on('listening', function () {
      var address = clientMUL.address();
      console.log('UDP Client listening on ' + address.address + ":" + address.port);
      clientMUL.setBroadcast(true)
      clientMUL.setMulticastTTL(128);
      clientMUL.addMembership(ip_multi);
  });

  clientMUL.on('message', function (message, remote) {
    console.log('From: ' + remote.address + ':' + remote.port);
		var recibido = JSON.parse(message);
    console.log("llego por Multicast.......");
    console.log(recibido);
    switch (recibido.codigo) {
        case 11:
							agregar(recibido.mensaje);
              buscarclave(recibido.mensaje);
              cascii = generarAscii(ver);
              agregar("Mensaje "+ver);
              console.log("Mensaje= "+ver+"\nClave= "+clave);
              Cifrado = cifrar(cascii);
              console.log("Mensaje Cifrado= "+Cifrado);
              agregar("Mensaje cifrado\n"+Cifrado);
              var json12 = mensaje(12);
              json12.mensaje=Cifrado;
              enviarmulti(json12);
        break;
        case 11:
							agregar("Respuesta del clientes\n "recibido.mensaje);
              var json14 = mensaje(14);
              if (ver ==  recibido.mensaje) {
                json14.mensaje="Aceptado";  
              }
              else {
                json14.mensaje="Rechazado";
              }

              enviarmulti(json14);
        break;
    }
  });
  //clientMUL.bind(port_multi);

  clientMUL.bind({
    address:'0.0.0.0',
    port:port_multi,
    exclusive:true
  });

}
/*----------------------------------------------------------------------------------------------------------------
funcion encargada de escuchar por Multicast recibe la ip de multicast y el puerto milticast
----------------------------------------------------------------------------------------------------------------*/
function enviarmulti(json) {

      var message = new Buffer(JSON.stringify(json));
      clientMUL.send(message, 0, message.length, port_multi,ip_broadcast);
      console.log("Enviando Multicast...");
      console.log(json);
}
/*----------------------------------------------------------------------------------------------------------------
esta funcion detecta el nombre ingresado en login y lanza a TCP UDP Y MULTICAST con la funcion iniciar()
----------------------------------------------------------------------------------------------------------------*/
function lanzar(){
    var fs = require('fs');
    fs.readFile('./dir/clientes.txt', 'utf8', function(err, data) {
        if( err ){
            console.log(err)
        }
        else{
            clientes = data;
      }
    });
    if (clientes) {
      nombre = document.getElementById("nombre").value;
      if (nombre)
      {
          document.getElementsByTagName("HEAD")[0].innerHTML+='<link rel="stylesheet" href="../css/servidor.css">';
          iniciar();
      }
    }
}

/*----------------------------------------------------------------------------------------------------------------
funcion encargada de mandar el mensaje prentacion del juego por multicast y agregar a la mesa a la lista de
jugadores y llama a empezar()
----------------------------------------------------------------------------------------------------------------*/
function enviar_empezar(){
    var json4 = mensaje(10);
    json4.mensaje="hola";
    enviarmulti(json4);
    empezar();
}

/*----------------------------------------------------------------------------------------------------------------
funcion encargada de epmezar la partida de blackjack limpiado el html por la mesa asi como crear los objetos y
iniciar la ronda
----------------------------------------------------------------------------------------------------------------*/
function empezar(){
    var node = document.getElementById("hserver");
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    document.getElementsByTagName("HEAD")[0].innerHTML+='<link rel="stylesheet" href="../css/lienzo.css">';
    clearInterval(hilo);
    serverUDP.close();
}
/*----------------------------------------------------------------------------------------------------------------
funcion encargada de devolver todo al index o menu principal donde se escoje si ser servidor o cliente
----------------------------------------------------------------------------------------------------------------*/
function volver()
{
    window.location = ("../index.html");
}

function agregar(mensaje) {
  var div = document.getElementById("consola");
  div.innerHTML=div.innerHTML+'<p>>: '+mensaje+'</p><br>';
}

function buscarclave(nombre) {
  if (clientes) {
    console.log(clientes);
    var vector = clientes.split(";");
    for (var i = 0; i < vector.length; i++) {
      var cli = vector[i].split("=");
      if (nombre == cli[0] ) {
        clave=cli[1];
      }
    }
    console.log(clave);
    agregar("Clave del cliente "+clave);
  }
}
function generarAscii(mensaje) {
  for (var i = 0; i < mensaje.length; i++) {
    var ascii =   mensaje[i].charCodeAt(0);
    var  binario = ascii.toString(2);
    if (i < mensaje.length-1) {
      cascii+=ascii+"$";
    }
    else {
      cascii+=ascii;
    }

  }
  return cascii;
}
function cifrar(cascii) {
  vector = cascii.split("$");
  var cbinario="";
  for (var i = 0; i < vector.length; i++) {
    var cifrar = vector[i] ^ clave;
    var descifrar = cifrar ^ clave;
    var  binario = cifrar.toString(2);
    if (i < vector.length-1) {
      cbinario+=binario+"#";
    }
    else {
      cbinario+=binario;
    }
  }
  return cbinario;
}

function descifrar(cbinario) {
    vector = cbinario.split("#");
    var mensaje="";
    for (var i = 0; i < vector.length; i++) {
      var numero = parseInt(vector[i], 2);
      var ascii = numero ^ clave;
      var letra = String.fromCharCode(ascii);
      mensaje += letra;
    }
    return mensaje;
}
