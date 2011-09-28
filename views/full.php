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
	 <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
	 <meta http-equiv="Content-Language" content="en"/>
	 <? if($model->get("name") && $model->get("name") != "Anonymous"): ?>
	 <title><?= utf8_encode($model->get("name")) ?> - Mapping Gothic France</title>
	 <? else: ?>
	 <title>Mapping Gothic France</title>
	 <? endif ?>
	 <link rel="icon" href="/media/ui/france_fav.png" type="image/png"/>
	 <link type="text/css" href="/styles?v=7" rel="stylesheet"/>
	 <? foreach($stylesheets as $s): ?>
	 <link type="text/css" href="<?= $s ?>" rel="stylesheet"/>
	 <? endforeach ?>
	 <!-- scripts -->
	 <script type="text/javascript" src="/script/dependencies/jquery.min.js"></script>
	 <script type="text/javascript" src="/script/dependencies/underscore.js"></script>
	 <script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>
	 <script type="text/javascript" src="http://google.com/jsapi"></script>
	 
	 <!--<script type="text/javascript" src="/script/compiled_.js?v=15"></script>-->
	 <script src="/stdlib"></script>
<script type="text/javascript">
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-4846859-8']);
  _gaq.push(['_setDomainName', 'none']);
  _gaq.push(['_setAllowLinker', true]);
  _gaq.push(['_trackPageview']);
  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
</script>
	</head>
	<body class="<?= get_class($model); ?>">
	 <script type="text/javascript">
		Archmap.initialize(<?= $json ?>);
	 </script>
	 <div id="container">
	  <div id="header">
	   <div id="purple"></div>
	   <div class="width">
	    <div class="padding">
		  <div id="logo">
		   <a href="<?= $home ?>/" class="home" tip="The Frontpage">
		    <img src="/media/ui/mgf_grotesque.png"/>
		   </a>
		   <a href="<?= $home."/map" ?>" class="map" tip="The Main Map">&nbsp;</a>
		   <a href="<?= $home."/pasteboard" ?>" class="pasteboard" tip="The Pasteboard">&nbsp;</a>
		   <a href="<?= $home."/simulation" ?>" class="simulation" tip="Simulation">&nbsp;</a>
		   <a href="<?= $home."/time" ?>" class="time" tip="Historical Maps &amp; Timeline">&nbsp;</a>
 		   <a href="<?= $home."/stories-and-essays" ?>" class="narrative" tip="Stories &amp; Essays">&nbsp;</a>
		  </div>
		  <div id="navigation">
		   <ul class="clear">
		    <li class="top"><a class="top" href="/about">About</a></li>
		    <?php if($user->get("isUser") > 1): ?>
		    <li class="top">
		     <a class="top" href="<?= $home ?>/you">You</a>
		    </li>
		    <?php else: ?>
		     <li class="top">
		      <div id="login">
		       <a class="top login" href="#">Login</a>
		       <div id="login-box" class="popover-panel">
		        <form id="login" action="<?= $home ?>/api/login?redirect=/<?= $original ?>" method="post">
			     <input class="password" type="text" name="email" value="email"/>
			     <input class="password" type="password" name="pword"/>
			     <input class="submit" type="submit" value="Login"/>
			    </form>
			   </div>
			  </div>
			 </li>
		     <?php endif; ?>
		   </ul>
		  </div> <!-- end of the user div -->
		  <script type="text/javascript">
		  Archmap.whenReady(function(){
		      Archmap.LayoutManager.searchAdjustment().hoverListeners();
		  });
		  </script>
		 </div>
	   </div>
	   <div id="searchbox">
        <? if($user->get("isUser") > 1): ?>
   	    <div id="logout">
   	     <a class="top" href="<?= $home ?>/api/logout?redirect=/<?= $original ?>">Logout</a>
   	    </div>
   	    <? endif ?>
		<div id="BasicSearch" class="component"></div>
	   </div>
	  </div> <!-- end of the header -->
	  <div id="shadow"></div>
	  <div id="stage" class="clear <?= get_class($model); ?>">
	   <div id="stage-padding">
	    <?php eval("?>".$content."<?"); ?>
	   </div>
	  </div>
	  <div id="footer">
	    <div class="padding">
        &copy; <a href="http://learn.columbia.edu">Media Center for Art History</a>, Columbia University <span> &amp;</span> <a href="http://art.vassar.edu">Art Department, Vassar College</a> <span> /// </span> 
		Made Possible by <a href="http://www.mellon.org/">The Mellon Foundation</a> <span> /// </span>
		<a href="/feedback">Feedback</a>
	    </div>
	  </div>
	 </div> <!-- end of the big container -->
	 <!-- the place where images go when they get big -->
	 <div id="big_image_container">
	  <a href="#" class="image_close">
       <img src="/media/ui/close.png"/>
      </a>
      <div id="big_image" class="full-holder"></div>
      <!--<div id="befores"></div>
      <div id="afters"></div>-->
     </div>
	</body>
</html>