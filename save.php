<?php

echo("test");
mail("laurent@thecoredev.fr", "sujet", "message...");
/*
    $to      = $_POST['form-email'];
    $subject = "Votre projet Maninghem menuiserie";
    $message = "Bonjour " . $_POST['form-name'] . "\r\nVoici la référence de votre projet : " . $_POST['form-reference'];
    $headers = "From: laurent@thecoredev.fr" . "\r\n" .
    "Reply-To: laurent@thecoredev.fr" . "\r\n" .
    "X-Mailer: PHP/" . phpversion();

    $success = mail($to, $subject, $message, $headers);
    if (!$success) {
        $errorMessage = error_get_last()['message'];
    }
    */
?>
