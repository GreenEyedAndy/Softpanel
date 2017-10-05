import { ProtocolStateMachine } from './Sc05BDProtocol';
import net = require('net');

let HOST: string = '127.0.0.1';
let PORT: number = 2006;

let protocolStateMachine: ProtocolStateMachine = new ProtocolStateMachine();
protocolStateMachine.on('decodingReady', data => {
    console.log(data);
});


net.createServer(socket => {
    console.log('CONNECTED: ' + socket.remoteAddress + ' : ' + socket.remotePort);

    socket.on('data', data => {
        protocolStateMachine.DecodeData(data.toString());
        //console.log('DATA ' + socket.remoteAddress + ' : ' + data);
    });

    socket.on('close', error => {
        console.log('CLOSED: ' + socket.remoteAddress + ' : ' + socket.remotePort);
    });
}).listen(PORT, HOST);


console.log('Server is running on port', PORT);

// protocolStateMachine.DecodeData('#Set:MasterControl:\n');
// protocolStateMachine.DecodeData("#Get:Prot");
// protocolStateMachine.DecodeData("ocol:\n");
// protocolStateMachine.DecodeData("#Set:Text:12;Andy;Cool\n");