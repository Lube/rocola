// Used by room.jade. This JS renders a Chat App for every chat room.
var socket = new WebSocket('ws://localhost:8080', 'echo-protocol') ;

var React = require('react');
var ReactDOM = require('react-dom');
var username = "Seba";
var uiLimit = 60;
var maxChatMessageLength = '400';

function getCurrUnixTime() {
    return Math.floor((new Date().getTime()) / 1000);
}

function convertToHHMI(unix_time) {
    var days = Math.floor(unix_time / 86400);
    var hours = Math.floor((unix_time - (days * 86400)) / 3600);
    var minutes = Math.floor((unix_time - ((hours * 3600) + (days * 86400))) / 60);

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

        return {messages: []};
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
            var HHMITime = convertToHHMI(msgInfo.unix_time);
            var newMsg = {
                username: msgInfo.origen,
                msg: msgInfo.data,
                time: HHMITime
            };

            // Here we are concatenating the new emitted message into our ChatApp's messages list
            var messages = this.state.messages;
            var newMessages = messages.concat(newMsg);
            this.setState({messages: newMessages});
            // this.trimMessagesStateIfNecessary();
    },
    render: function() {
        return (
            <div className='chatApp'>
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

var Message = React.createClass({
    componentDidMount: function() {
        var messageDOM = this.refs.message;
        messageDOM.scrollIntoView();
    },
    render: function() {
        var msg = this.props.msg;
        console.log(msg);
        return (
            <li className='message' ref='message'>
                <span className='messageTime'>{msg.time} </span>
                <b className='username'>{msg.origen}</b> 
                <span className='messageText'>: {msg.data}</span>
            </li>
        );
    }
});

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
            message: msgDOMNode.value
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

React.render(
    <ChatApp uiLimit={uiLimit}/>,
    document.getElementById('app')
);