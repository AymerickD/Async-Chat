(async function () {
    'use strict';


    var userName = prompt ("Veuillez renseigner votre nom d'utilisateur");

    var ws = new WebSocket('ws://' + wsUrl);
    var _receiver = document.getElementById('ws_receiver');
    var channel = 'general';
    var botName = 'ChatBot';
    var chatNav = document.getElementById("chat_nav");


    chatNav.addEventListener("click", e => {
        var nextChannel = e.target.dataset.channel

        if (nextChannel === channel) {
            return false;
        }

        _receiver.innerHTML = "";

        ws.send(JSON.stringify({
            action: 'subscribe',
            channel: nextChannel,
            user: userName
        }));

        ws.send(JSON.stringify({
            action: 'unsubscribe',
            channel: channel,
            user: userName
        }));

        channel = nextChannel;
    })

    var addMessageToChannel = function (message) {
        var data = JSON.parse(message)

        if (channel === data.channel) {
            if (data.user === userName) {
                _receiver.innerHTML += '<div class="message_self">' + data.message + '</div>';
            } else if (data.user === botName ) {
                _receiver.innerHTML += '<div class="message_bot">' + data.message + '</div>';
            } else {
                _receiver.innerHTML += '<div class="message">' + '<span class="chat-user">' + data.user + '</span>' + data.message + '</div>';
            }
        }
    };

    var botMessageToChannel = function (message) {
        return addMessageToChannel(JSON.stringify({
            action: 'message',
            channel: channel,
            user: botName,
            message: message
        }));
    };

    ws.onopen = function () {
        ws.send(JSON.stringify({
            action: 'subscribe',
            channel: channel,
            user: userName
        }));
    };

    ws.onmessage = function (event) {
        addMessageToChannel(event.data);
    };

    ws.onclose = function () {
        botMessageToChannel('Vous êtes déconnecté')
    };

    ws.onerror = function () {
        botMessageToChannel('Une erreur est apparue !');
    };


    var _textInput = document.getElementById('ws_to_send');
    var _textSender = document.getElementById('ws_send');

    var sendTextInputContent = function () {
        // Get text input content
        var content = _textInput.value;

        // Send it to WS
        ws.send(JSON.stringify({
            action: 'message',
            user: userName,
            message: content,
            channel: channel
        }));

        // Reset input
        _textInput.value = '';
    };

    _textSender.onclick = sendTextInputContent;
    _textInput.onkeyup = function (e) {
        // Check for Enter key
        if (e.code === "Enter" || e.code === "NumpadEnter") {
            sendTextInputContent();
        }
    };

    $(window).bind("beforeunload", function () {
        ws.send(JSON.stringify({
            action: 'unsubscribe',
            channel: channel,
            user: userName
        }));
        ws.close();
    })
})();