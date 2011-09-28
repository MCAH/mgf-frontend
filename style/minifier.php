<?php

    header("Content-type:text/css");
    
    $sheets = array("Archmap","dark");
    foreach($sheets as $sheet) {
        echo str_replace("\n"," ",file_get_contents($_SERVER['DOCUMENT_ROOT']."/archmap/codebase/js/style/$sheet.css"));
    }

?>