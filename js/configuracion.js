function cambiar()
{
	var IB = document.getElementById("IpBrd").value;
	var IM = document.getElementById("IpMul").value;
	var PU = document.getElementById("PUDP").value;
	var PT = document.getElementById("PTCP").value;
	var PM = document.getElementById("PMUL").value;

	if (IB && IM && PU && PT ) 
	{

		var conf= IB+"-"+IM+"-"+PU+"-"+PT+"-"+PM;
		var fs = require('fs');
		var res;
		fs.writeFile('./dir/configuracion.txt',conf, function(err) {
		    if( err ){
		        console.log( err );
		    }
		    else{
		        console.log('Se cambiado la configuracion');
		    }
		});
	window.location = ("../index.html");	
	}
}

function cargar()
{
	var fs = require('fs');
	fs.readFile('./dir/configuracion.txt', 'utf8', function(err, data) {
	    if( err ){
	        console.log(err)
	    }
	    else{
	        console.log(data);
	        res = data.split("-");
			console.log(res);
			IB= res[0];
			IM= res[1];
			PU= res[2];
			PT= res[3];
			PM= res[4];
			document.getElementById("IpBrd").value=IB;
			document.getElementById("IpMul").value=IM; 
			document.getElementById("PUDP").value=PU;
			document.getElementById("PTCP").value=PT;
			document.getElementById("PMUL").value=PM;
	    }
	});
}