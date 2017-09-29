<?php
include 'config.php';

/* Open a connection */
$link = mysqli_connect($db_host, $db_username, $db_password, $db_name);

/* check connection */
if (mysqli_connect_errno()) {
    printf("Connect failed: %s\n", mysqli_connect_error());
}

/* get id of last ticket processed */
$fp = fopen(dirname(__FILE__) . "/lastidlog.txt", "r");
$last_id = fread($fp, 1024);
fclose($fp);

class Ticket
{
    public $author;
    public $message;
    public $ticketUrl;

    function __construct($ticketID)
    {
        $this->author = $this->getAuthor($ticketID);
        $this->message = $this->getMessage($ticketID);
        $this->ticketUrl = $this->getTicketUrl($ticketID);
    }

    private function getAuthor($id)
    {
        global $link;
        $tempdata = mysqli_query($link, "SELECT * FROM titles WHERE id='$id'");
        $row = mysqli_fetch_array($tempdata);
        $uuid = $row['author'];
        $tempdata = mysqli_query($link, "SELECT * FROM uuids WHERE uuid='$uuid'");
        $row = mysqli_fetch_array($tempdata);
        return $row['name'];
    }

    private function getMessage($id)
    {
        global $link;
        $tempdata = mysqli_query($link, "SELECT * FROM titles WHERE id='$id'");
        $row = mysqli_fetch_array($tempdata);
        return $row['to'];
    }

    private function getTicketUrl($id)
    {
        global $ticket_panel_url;
        return $ticket_panel_url . $id;
    }
}

function send($ticketID, $message, $author, $ticketUrl)
{
    global $webhook_url;
    $data = '{
                "username": "Ticket #' . $ticketID . '",
                "content": "**' . $author . ':** ' . $message . '\n' . $ticketUrl . '"
            }';

    $data = $string = preg_replace('/\s+/', ' ', $data);

    $ch = curl_init($webhook_url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);

    return $result;
}

$data = mysqli_query($link, "SELECT * FROM titles WHERE id>'$last_id'") or die(mysqli_error());
while ($row = mysqli_fetch_array($data)) {

    $ticketId = $row['id'];
    $ticket = new Ticket($ticketId);

    send($ticketId, $ticket->message, $ticket->author, $ticket->ticketUrl);
    $last_id = $ticketId;
}

$fp = fopen(dirname(__FILE__) . "/lastidlog.txt", "w");
fwrite($fp, $last_id);
fclose($fp);
?>

