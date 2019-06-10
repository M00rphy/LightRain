<!--?php
session_start();
if ( empty($_SESSION['username']))
{echo '<script>alert("You are not logged in!");</script>';
header("Refresh: 0;login/logout.php");
}
?-->
    <html lang="en">
    <link rel="manifest" href="manifest.webmanifest">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, user-scalable=1.0, minimum-scale=1.0, maximum-scale=1.0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script async src="https://cdn.jsdelivr.net/npm/pwacompat@2.0.6/pwacompat.min.js" integrity="sha384-GOaSLecPIMCJksN83HLuYf9FToOiQ2Df0+0ntv7ey8zjUHESXhthwvq9hXAZTifA" crossorigin="anonymous"></script>
        <title>Codename BW</title>

        <script src="lib/quintus.js"></script>
        <script src="lib/quintus_2d.js"></script>
        <script src="lib/quintus_anim.js"></script>
        <script src="lib/quintus_audio.js"></script>
        <script src="lib/quintus_input.js"></script>
        <script src="lib/quintus_scenes.js"></script>
        <script src="lib/quintus_sprites.js"></script>
        <script src="lib/quintus_tmx.js"></script>
        <script src="lib/quintus_touch.js"></script>
        <script src="lib/quintus_ui.js"></script>
        <script src="lib/quintus_persist.js"></script>

        <script src="scripts/bw.js"></script>

        <link rel="stylesheet" href="css/load.css" />
        <link rel="stylesheet" href="css/landscape.css" />
        <link rel="stylesheet" href="css/mainstyle.css"/>
    </head>

    <body class="bgimg">
        <div id="loading">
            <div id="loading_container">
                <div id="loading_progress"><span>Loading...</span></div>
            </div>
        </div>
    </body>
    </html>