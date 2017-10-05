import {EventEmitter} from 'events';

const SOM: string = '#';
const DividerLvl1: string = ':';
const DividerLvl2: string = '.';
const EOM: string = '\n';
const CR: string = '\r';

interface IProtocolStateMachine
{
    SetState(newState: ProtocolState): void;
    GetState(): ProtocolState;
    DecodeData(data: string): void;
    Message(data: string): void;
    StoreDecodedData(type: string, data: any): void;
    DecodingReady(): void;
}

export class ProtocolStateMachine extends EventEmitter implements IProtocolStateMachine
{
    private state: ProtocolState;
    private decodedData: { [id: string] : string; };

    constructor() {
        super();
        this.decodedData = {};
        this.SetState(new DecodeStartOfMessage(this));        
    }

    SetState(newState: ProtocolState): void {
        this.state = newState;
        console.log('New State = ' + this.state.constructor.name);
    }

    GetState(): ProtocolState {
        return this.state;
    }

    DecodeData(data: string): void {
        for (var index = 0; index < data.length; index++) {
            var element = data.charAt(index);
            this.state.ReadChar(element);
        }
    }

    Message(data: string): void {
        console.log(data);
    }

    StoreDecodedData(type: string, data: any): void {
        this.decodedData[type] = data;
    }

    DecodingReady(): void {
        this.emit('decodingReady', this.decodedData);
    }
}

abstract class ProtocolState
{
    constructor(protocolStateMachine: IProtocolStateMachine) {
        this.ProtocolStateMachine = protocolStateMachine;        
    }

    protected ProtocolStateMachine: IProtocolStateMachine;
    public abstract ReadChar(ch: string): void;
}

class DecodeStartOfMessage extends ProtocolState
{
    constructor(protocolStateMachine: IProtocolStateMachine) {
        super(protocolStateMachine);
    }

    public ReadChar(ch: string): void {
        if (ch === SOM)
        {
            this.ProtocolStateMachine.Message("SOM");
            this.ProtocolStateMachine.SetState(new DecodeCommandType(this.ProtocolStateMachine));
        }
    }
}

const STR_CTYPE: string = 'CTYPE';
class DecodeCommandType extends ProtocolState
{
    private commandType: string;

    constructor(protocolStateMachine: IProtocolStateMachine) {
        super(protocolStateMachine);
        this.commandType = '';
    }

    public ReadChar(ch: string): void {
        if (ch !== DividerLvl1)
        {
            this.commandType += ch;
        }
        else
        {
            this.ProtocolStateMachine.Message(this.commandType);
            this.ProtocolStateMachine.StoreDecodedData(STR_CTYPE, this.commandType);
            this.ProtocolStateMachine.SetState(new DecodeCommand(this.ProtocolStateMachine));
        }
    }
}

const STR_COMMAND: string = 'COMMAND';
class DecodeCommand extends ProtocolState
{
    private command: string;

    constructor(protocolStateMachine: IProtocolStateMachine) {
        super(protocolStateMachine);
        this.command = '';
    }

    public ReadChar(ch: string): void {
        if (ch !== DividerLvl1)
        {
            this.command += ch;
        }
        else
        {
            this.ProtocolStateMachine.Message(this.command);
            this.ProtocolStateMachine.StoreDecodedData(STR_COMMAND, this.command);
            this.ProtocolStateMachine.SetState(new DecodeData(this.ProtocolStateMachine));
        }
    }
}

const STR_DATA: string = 'DATA';
class DecodeData extends ProtocolState
{
    private data: string;
    
    constructor(protocolStateMachine: IProtocolStateMachine) {
        super(protocolStateMachine);
        this.data = '';
    }

    public ReadChar(ch: string): void {
        if (ch !== EOM)
        {
            this.data += ch;
        }
        else
        {
            this.ProtocolStateMachine.Message(this.data);
            this.ProtocolStateMachine.StoreDecodedData(STR_DATA, this.data);
            this.ProtocolStateMachine.DecodingReady();
            this.ProtocolStateMachine.SetState(new DecodeStartOfMessage(this.ProtocolStateMachine));
        }
    }
}