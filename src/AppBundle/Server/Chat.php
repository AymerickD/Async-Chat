<?php
namespace App\AppBundle\Server;

use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;

class Chat implements MessageComponentInterface {

    /**
     * @var \SplObjectStorage
     */
    private $clients;

    private $users = [];

    private $channels = [];

    private $botName = 'ChatBot';

    private $defaultChannel = 'general';

    public function __construct()
    {
        $this->clients = new \SplObjectStorage();
    }

    function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);

        $this->users[$conn->resourceId] = [
            'connection' => $conn,
            'user' => '',
            'channels' => []
        ];
    }

    function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);

        unset($this->users[$conn->resourceId]);
    }

    function onError(ConnectionInterface $conn, \Exception $e)
    {
        $conn->send('An error has occurred: '.$e->getMessage());
        $conn->close();
    }

    function onMessage(ConnectionInterface $from, $message)
    {
        $messageData = json_decode($message);
        if ($messageData === null) {
            return false;
        }

        $action = $messageData->action ?? 'unknown';
        $channel = $messageData->channel ?? $this->defaultChannel;
        $user = $messageData->user ?? $this->botName;
        $message = $messageData->message ?? '';

        switch ($action) {
            case 'subscribe':
                $this->subscribeToChannel($from, $channel, $user);
                return true;
            case 'unsubscribe':
                $this->unsubscribeFromChannel($from, $channel, $user);
                return true;
            case 'message':
                return $this->sendMessageToChannel($from, $channel, $user, $message);
            default:
                echo sprintf('Action "%s" is not supported yet!', $action);
                break;
        }
        return false;
    }


    private function subscribeToChannel(ConnectionInterface $conn, $channel, $user)
    {
        $this->channels[$channel][$conn->resourceId] = $this->users[$conn->resourceId];
        $this->users[$conn->resourceId]['channels'][$channel] = $channel;
        $this->sendMessageToChannel(
            $conn,
            $channel,
            $this->botName,
            $user." a rejoint le salon ".$channel
        );
    }

    private function unsubscribeFromChannel(ConnectionInterface $conn, $channel, $user)
    {
        if (array_key_exists($channel, $this->users[$conn->resourceId]['channels'])) {
            unset($this->users[$conn->resourceId]['channels']);
            unset($this->channels[$channel][$conn->resourceId]);
        }
        foreach ($this->users as $connectionId => $userConnection) {
            if (array_key_exists($channel, $userConnection['channels'])) {
                $userConnection['connection']->send(json_encode([
                    'action' => 'message',
                    'channel' => $channel,
                    'user' => $this->botName,
                    'message' => $user.' left #'.$channel
                ]));
            }
        }
    }


    private function sendMessageToChannel(ConnectionInterface $conn, $channel, $user, $message)
    {
        if (!isset($this->users[$conn->resourceId]['channels'][$channel])) {
            return false;
        }

        // Gestion par channel, boucle uniquement sur les users du channel
        foreach ($this->channels[$channel] as $connectionId => $userConnection) {
            $userConnection['connection']->send(json_encode([
                'action' => 'message',
                'channel' => $channel,
                'user' => $user,
                'message' => $message
            ]));
        }

        // Version sans channel, envoie à tous les users contenu dans le chat
        /*foreach ($this->users as $connectionId => $userConnection) {
            if (array_key_exists($channel, $userConnection['channels'])) {
                $userConnection['connection']->send(json_encode([
                    'action' => 'message',
                    'channel' => $channel,
                    'user' => $user,
                    'message' => $message
                ]));
            }
        }*/
        return true;
    }
}