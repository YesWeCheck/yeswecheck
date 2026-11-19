<?php

// Add this entry to the array returned by config/services.php
return [

    'yeswecheck' => [
        'key' => env('YWC_API_KEY'),
        'url' => env('YWC_BASE_URL', 'https://api.yeswecheck.fr'),
    ],

];
