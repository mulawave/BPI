<?php
defined('BASEPATH') OR exit('No direct script access allowed');

function generate_captcha() {
    $ci = &get_instance();
    
    // Generate random math question
    $num1 = rand(1, 10);
    $num2 = rand(1, 10);
    $operators = ['+', '-', '*'];
    $operator = $operators[array_rand($operators)];
    
    // Calculate correct answer
    switch ($operator) {
        case '+':
            $answer = $num1 + $num2;
            break;
        case '-':
            $answer = $num1 - $num2;
            break;
        case '*':
            $answer = $num1 * $num2;
            break;
        default:
            $answer = $num1 + $num2;
    }
    
    // Store answer in session
    $ci->session->set_userdata('captcha_answer', $answer);
    
    // Create CAPTCHA image
    $image = imagecreatetruecolor(120, 40);
    $bg_color = imagecolorallocate($image, 255, 255, 255);
    $text_color = imagecolorallocate($image, 0, 0, 0);
    imagefilledrectangle($image, 0, 0, 120, 40, $bg_color);
    
    // Add some noise (lines)
    $line_color = imagecolorallocate($image, 200, 200, 200);
    for ($i = 0; $i < 5; $i++) {
        imageline($image, rand(0, 120), rand(0, 40), rand(0, 120), rand(0, 40), $line_color);
    }
    
    // Write math question
    $question = "$num1 $operator $num2 = ?";
    imagestring($image, 5, 10, 10, $question, $text_color);
    
    // Output image
    ob_start();
    imagepng($image);
    $image_data = ob_get_clean();
    imagedestroy($image);
    
    return base64_encode($image_data);
}
?>