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

        case 2:
            json = {codigo:2,
                    nombre:"cliente"}
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
    }
    return json;
}
/*----------------------------------------------------------------------------------------------------------------
                                            varibles de conexion
----------------------------------------------------------------------------------------------------------------*/
var dgram = require('dgram');
var net = require('net');
var port_udp;
var port_tcp;
var ip_multi;
var ip_broadcast;
var port_multi;
var message;
var json = mensaje(2);
var list_server = new Array();
var list_json = new Array();
var aux_list_server = new Array();
var clientUDP;
var clientTCP;
var clientMUL;
var actualizar;
var nombres=[];
var ids=[];
var mostrar_udp=true;
var pintar=0;
var nombre;
var manual=false;
var miembro={nombre:"",id:null};
var clientes = "";

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
            console.log("Datos de conexion: "+"IM: "+ip_multi+" PU: "+port_udp+" PT: "+port_tcp+" PM: "+port_multi);
            UDP(port_udp);
        }
    });
}
/*----------------------------------------------------------------------------------------------------------------
funcion encargada escuchar por UDP recibe el puerto UDP
----------------------------------------------------------------------------------------------------------------*/
function UDP(port){
    clientUDP = dgram.createSocket("udp4");
    clientUDP.on('err',function(err){
        console.log("Error -------- UDP");
        console.log(err);
        clientUDP.close();
    })
    clientUDP.on('message', (msg, rinfo) => {
    json = JSON.parse(msg);
    console.log("llego por UDP.......");
    console.log(json);
    console.log(rinfo.address+" "+rinfo.port);
    if(mostrar_udp){
        if(list_server.indexOf(rinfo.address)==-1){
            aux_list_server.push(rinfo.address);
            list_server.push(rinfo.address);
            list_json.push(json);
            listar_servidores(json,rinfo);
        }
        else{
            var i = list_server.indexOf(rinfo.address);
            list_json[i].tiempo = json.tiempo;
            list_json[i].espacios = json.espacios;
            document.getElementById(list_server[i]+"tiempo").innerHTML=json.tiempo+"s";
            if(aux_list_server.indexOf(list_server[i])==-1){
                aux_list_server.push(list_server[i]);
            }
    }
    }
    });
    clientUDP.bind(port);
}
/*----------------------------------------------------------------------------------------------------------------
funcion encargada de mandar el TCP y escuchar por TCP recibe, el json corresponde al mensaje json a enviar en este
el inicial es el de preguntar si puede jugar ip del cliente y el puerto TCP para asi crear el socket con ese
cliente y mandar mensajes mas adelante
----------------------------------------------------------------------------------------------------------------*/
function TCP(json,ip_tcp,port_tcp){
    clientTCP = net.connect({port:port_tcp, host:ip_tcp}, () => {
    console.log('connected to server!');
    json.nombre=nombre;
    clientTCP.write(JSON.stringify(json));
    });
    clientTCP.on('data', (data) => {
    var recibido = JSON.parse(data);
    console.log("llego por TCP.......");
    console.log(recibido);
    switch (recibido.codigo) {
      case 3:
                if (recibido.aceptado==true) {
										var cajas =  document.getElementById("area_server");
										cajas.style.display="none";
                    document.getElementById("titulo").innerHTML="Esperando...";
                    ip_multi=recibido.direccion;
                    id = recibido.id;
                    Multicast(ip_multi,port_multi);
                    mostrar_udp=false;
                }
          break;
    }
    });
    clientTCP.on('error', () => {
        //window.alert("El Servidor se Desconecto");
        location.href='../index.html';
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
        case 4:
                for (var i = 0; i < recibido.miembros.length; i++) {
									nombres.push(recibido.miembros[i].nombre);
									ids.push(recibido.miembros[i].id);
                }
                empezar();
        break;
				case 10:
					empezar();
				break;
        case 5:
							pintar(recibido.x,recibido.y,recibido.tam,recibido.color);
        break;
				case 6:
              borrando(recibido.x,recibido.y,recibido.tam);
        break;
        case 7:
							vaciar();
        break;
    }
  });
  clientMUL.bind(port_multi);
}

/*----------------------------------------------------------------------------------------------------------------
funcion encargada de escuchar por Multicast recibe la ip de multicast y el puerto milticast
----------------------------------------------------------------------------------------------------------------*/
function enviarmulti(json) {

      var message = new Buffer(JSON.stringify(json));
      clientMUL.send(message, 0, message.length, port_multi,ip_multi);
      console.log("Enviando Multicast...");
      console.log(json);
}

/*----------------------------------------------------------------------------------------------------------------
funcion encargada de insertar las cartas que representan a los servidores para asi conecetarse a los mismos
----------------------------------------------------------------------------------------------------------------*/
function listar_servidores(json,rinfo){
  var section = document.getElementById("area_server");
  var button = document.createElement("button");
  button.id = rinfo.address;
	console.log(button);
  button.onclick=function(){conectar(this);};
    var h3 = document.createElement("h3");
    h3.innerHTML=json.nombre;
		var img = document.createElement("img");
    img.src="../img/server.png";
    var div = document.createElement("div");
      var p2 = document.createElement("p");
      p2.id=rinfo.address+"tiempo";
      p2.innerHTML=json.tiempo+"s";

  section.appendChild(button);
  button.appendChild(h3);
	button.appendChild(img);
  button.appendChild(div);
  div.appendChild(p2);
}
/*----------------------------------------------------------------------------------------------------------------
funcion encargada de actualizar las cartas de los servidores para manipular si se desconectan o aparecen nuevos
----------------------------------------------------------------------------------------------------------------*/
actualizar = setInterval(function(){

  var i_eliminar = new Array();
  for (var i = 0; i < list_json.length; i++) {
    if(aux_list_server.indexOf(list_server[i])==-1){
        i_eliminar.push(i);
    }
  }
  var j;
  for (var i = 0; i < i_eliminar.length; i++) {
      j = i_eliminar[i];
      document.getElementById(list_server[j]).remove();
      list_server.splice(j,1);
      list_json.splice(j,1);
  }
  aux_list_server = new Array();
},1000);
/*----------------------------------------------------------------------------------------------------------------
funcion encargada mandar la solicitud tcp a saber si se puede unir a la partida
----------------------------------------------------------------------------------------------------------------*/
function conectar(element){
    TCP(mensaje(2),element.id,port_tcp);
}

function lanzar(){
    nombre = document.getElementById("nombre").value;
		password = document.getElementById("password").value;
		var nuevo="";
    if (nombre && password ){
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
					console.log(clientes);
					var vector = clientes.split(";");
					for (var i = 0; i < vector.length; i++) {
						var cli = vector[i].split("=");
						if (nombre == cli[0] ) {
							cli[1]=""+password;
						}
						if (i < vector.length-1) {
							nuevo+=cli[0]+"="+cli[1]+";";
						}
						else {
							nuevo+=cli[0]+"="+cli[1];
						}
					}
					console.log(nuevo);
					fs.writeFile('./dir/clientes.txt',nuevo, function(err) {
					    if( err ){
					        console.log( err );
					    }
					    else{
					        console.log('Se cambiado la base de datos de clientes');
					    }
					});
					document.getElementsByTagName("HEAD")[0].innerHTML+='<link rel="stylesheet" href="../css/cliente.css">';
					iniciar();
				}
    }
}



/*----------------------------------------------------------------------------------------------------------------
funcion encargada de epmezar la partida de blackjack limpiado el html por la mesa asi como crear los objetos
----------------------------------------------------------------------------------------------------------------*/
function empezar(){
    document.getElementsByTagName("HEAD")[0].innerHTML+='<link rel="stylesheet" href="../css/lienzo.css">';
    clientUDP.close();
		var cajas =  document.getElementById("hclient");
		cajas.style.display="none";
    clearInterval(actualizar);

    console.log("-------------Miembros--------------------");
    console.log(nombres);
}
/*----------------------------------------------------------------------------------------------------------------
funcion encargada de devolver todo al index o menu principal donde se escoje si ser servidor o cliente
----------------------------------------------------------------------------------------------------------------*/
function volver(){
    window.location = ("../index.html");
}
