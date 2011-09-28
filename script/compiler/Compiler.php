<?php

    header("Content-type: text/javascript");
	header("Cache-Control: max-age:172800, public");
	
	$file = "";
	$scripts = array("Archmap","IO","Template","Editor","ComponentBase","Config","DataStore","Models",
		"Elements","Utilities","_base","LayoutManager","ImageOverlays","Interlocutor");
	foreach($scripts as $script) {
		$file .= file_get_contents("script/lib/$script.js");
	}
    if($_GET["compile"] == "true") {
        file_put_contents("script/compiler/__stdlib__.js",$file);
    }
    else {
        echo $file;
    }

?>