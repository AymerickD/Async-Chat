(async function () {
    'use strict';
    var userName = prompt ("Veuillez renseigner votre nom d'utilisateur");

    var ws = new WebSocket('ws://' + wsUrl);
    var _receiver = document.getElementById('ws_receiver');
    var defaultChannel = 'general';
    var botName = 'ChatBot';

    var addMessageToChannel = function (message) {

        var data = JSON.parse(message)

        if (data.user === userName) {
            _receiver.innerHTML += '<div class="message_self">' + data.message + '</div>';
        } else {
            _receiver.innerHTML += '<div class="message">' + '<span class="chat-user">' + data.user + '</span>' + data.message + '</div>';
        }

    };

    var botMessageToGeneral = function (message) {
        return addMessageToChannel(JSON.stringify({
            action: 'message',
            channel: defaultChannel,
            user: botName,
            message: message
        }));
    };

    ws.onopen = function () {
        ws.send(JSON.stringify({
            action: 'subscribe',
            channel: defaultChannel,
            user: userName
        }));
        _receiver.innerHTML += '<div class="message">' + "Vous êtes connecté !" + '</div>';
    };

    ws.onmessage = function (event) {
        console.log(event.data)
        addMessageToChannel(event.data);
    };

    ws.onclose = function () {
        botMessageToGeneral('Vous êtes déconnecté')
    };

    ws.onerror = function () {
        botMessageToGeneral('Une erreur est apparue !');
    };


    var _textInput = document.getElementById('ws_to_send');
    var _textSender = document.getElementById('ws_send');
    var _wsClose = document.getElementById("ws_close");
    var enterKeyCode = 13;

    var sendTextInputContent = function () {
        // Get text input content
        var content = _textInput.value;

        // Send it to WS
        ws.send(JSON.stringify({
            action: 'message',
            user: userName,
            message: content,
            channel: 'general'
        }));

        // Reset input
        _textInput.value = '';
    };

    _textSender.onclick = sendTextInputContent;
    _textInput.onkeyup = function (e) {
        // Check for Enter key
        if (e.keyCode === enterKeyCode) {
            sendTextInputContent();
        }
    };

    _wsClose.onclick = function () {
        ws.send(JSON.stringify({
            action: 'unsubscribe',
            channel: defaultChannel,
            user: userName
        }));
        ws.close();
    }

    $(window).bind("beforeunload", function () {
        ws.send(JSON.stringify({
            action: 'unsubscribe',
            channel: defaultChannel,
            user: userName
        }));
        ws.close();
    })
})();