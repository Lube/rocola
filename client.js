var React = require('react');
var ReactDOM = require('react-dom');
var username = $('#username').val();
var uiLimit = 60;
var maxChatMessageLength = '400';



function convertToHHMI(unix_time) {
    var days = Math.floor(unix_time / 86400);
    var hours = Math.floor((unix_time - (days * 86400)) / 3600);
    var minutes = Math.floor((unix_time - ((hours * 3600) + (days * 86400))) / 60);

    hours = hours - 3; //TIMEZONE 

    if (hours < 0) {
        hours = 24 + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (hours < 10) {
        hours = '0' + hours;
    }

    return hours + ':' + minutes;
}

// Flux Architecture
// ChatApp is the central state store. Notice that all other React
// components use props, not state. Whenever a state in ChatApp changes
// usually by recieving a socket message from other user, the props
// are updated automatically by React.js. This makes development simple,
// as ChatApp is the only React component that is dynamic.
var ChatApp = React.createClass({
    getInitialState: function() {
        // Handle socket chat message from other users
        socket.onmessage = this.messageRecieve;

        return {messages: [], participantes: []};
    },
    trimMessagesStateIfNecessary: function() {
        var messages = this.state.messages;
        var messagesLength = messages.length;
        var appUiLim = this.props.uiLimit;

        if (appUiLim < messagesLength) {
            messages.splice(0, messagesLength - uiLimit);
        }

        this.setState({messages: messages});
    },
    // Called when app detects a new message from SocketIO
    messageRecieve: function(msgInfo) {
            // Create a new msgInfo for this current React app

            // Hour:Minute time

            msgInfo = JSON.parse(msgInfo.data);
            var HHMITime = convertToHHMI(msgInfo.data.time);

            if (msgInfo.tipo == 'Mensaje')
            {
                var newMsg = {
                    username: msgInfo.data.username,
                    msg: msgInfo.data.data,
                    origen: msgInfo.data.origen,
                    time: HHMITime
                };

                // Here we are concatenating the new emitted message into our ChatApp's messages list
                var messages = this.state.messages;
                var newMessages = messages.concat(newMsg);
                this.setState({messages: newMessages});
                this.trimMessagesStateIfNecessary();
            } 
            else if (msgInfo.tipo == 'Participantes')
            {
                this.setState({participantes: msgInfo.data});
            }
    },
    render: function() {
        return (
            <div className='chatApp'>
                <ParticipantesList participantes={this.state.participantes}/>
                <MessagesList messages={this.state.messages}/>
                <ChatForm />
            </div>
        );
    }
});

var MessagesList = React.createClass({
    componentDidMount: function() {
        var messagesList = this.refs.messagesList;
    },
    render: function() {
        var messageNodes = this.props.messages.map(function(msg) {
            return (<Message msg={msg} />);
        });

        return (
            <ul className='messagesList' ref='messagesList'>
                {messageNodes}
            </ul>
        );
    }
});

var ParticipantesList = React.createClass({
    componentDidMount: function() {
        var participantesList = this.refs.participantesList;
    },
    render: function() {
        var participantesNodes = this.props.participantes.map(function(participante) {
            return (<span> {participante.username} </span>);
        });

        return (
        <div className="well">
            <h4> En esta sala:</h4>
            <ul className='participantesList' ref='participantesList'>
                {participantesNodes}
            </ul>
        </div>
        );
    }
});

var Message = React.createClass({
    componentDidMount: function() {
        var messageDOM = this.refs.message;
        messageDOM.scrollIntoView();
    },
    render: function() {
        var msg = this.props.msg;

        if (msg.msg.match(/([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/i) == null)
            return (
                <li className='message' ref='message'>
                    <span className='messageTime'>{msg.time} </span>
                    <span className='username'>[{msg.origen}]</span> 
                    <b className='username'>{msg.username}</b> 
                    <span className='messageText'>: {msg.msg}</span>
                </li>
            );
        else
           return (
                <li className='message' ref='message'>
                    <span className='messageTime'>{msg.time} </span>
                    <span className='username'>[{msg.origen}]</span> 
                    <b className='username'>{msg.username}</b> 
                    <img style={{height: '150px', width: 'auto'}} src={msg.msg} className='messageText' />
                </li>
            ); 
    }
});


var WarningMessage = React.createClass({
      render: function() {
        return (
            <div className='alert-danger'>
                No seas bigote!!
            </div>
        );
    }
})


var ChatForm = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();

        // The DOM node for <input> chat message
        var msgDOMNode = this.refs.msg;
        
        if (msgDOMNode.value === '') {
            return;
        }

        var msgInfo = {
            tipo: "Mensaje",
            data: msgDOMNode.value,
            username: $("#username").val()
        };

        socket.send(JSON.stringify(msgInfo));
        msgDOMNode.value = '';
    },
    render: function() {
        return (
            <form className='chatForm' onSubmit={this.handleSubmit}>
                <input className='input_field chat_input_field' type='text' maxLength={maxChatMessageLength} placeholder='Say something...' ref='msg'/>
            </form>
        );
    }
})

var socket = new WebSocket('ws://192.168.100.57:8080', 'echo-protocol') ;

socket.onerror = function () {
    ReactDOM.render(
        <WarningMessage />,
        document.getElementById('app')
    );
}

socket.onopen = function () {
    ReactDOM.render(
        <ChatApp uiLimit={uiLimit}/>,
        document.getElementById('app')
    );
}

