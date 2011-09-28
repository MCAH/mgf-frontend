<?php
   
   header("Content-type:text/plain");
   $scripts = explode("+",str_replace("/framework/script/","",$_SERVER["REQUEST_URI"]));
   foreach($scripts as $script) {
      echo file_get_contents($script);
      echo "\n";
   }
   
?>