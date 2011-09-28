<!doctype html>
  <html lang="en">
	<head>
		<!--
        
           __     __)    _____)  ________) 
          (, /|  /|    /        (, /       
            / | / |   /   ___     /___,    
         ) /  |/  |_ /     / ) ) /         
        (_/   '     (____ /   (_/
        
        
		-->
	 <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	 <meta http-equiv="Content-Language" content="en"/>
	 <title>Mapping Gothic France</title>
	 <link rel="icon" href="/media/ui/france_fav.png" type="image/png"/>
	 <!-- styles -->
	 <link type="text/css" href="/styles?v=4" rel="stylesheet"/>
	 <!-- scripts -->
	 <script type="text/javascript" src="/script/dependencies/jquery.min.js"></script>
	 <script type="text/javascript" src="/script/dependencies/underscore.js"></script>
	 <script type="text/javascript" src="http://maps.google.com/maps/api/js?v=3.1&sensor=false"></script>
 	 <script type="text/javascript" src="/script/compiled_.js?v=13"></script>
	</head>
	<body class="<?= get_class($model); ?>">
	 <script type="text/javascript">
	 	$(function(){
			Archmap.initialize(<?= $json ?>);
		});
	 </script>
	 <div id="container" class="naked">
	  <div id="stage">
	   <?php eval("?>".$content."<?"); ?>
	  </div>
	 </div> <!-- end of the big container -->
	</body>
</html>