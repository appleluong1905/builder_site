<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Contact</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link href="css/build.css" rel="stylesheet">
    <link href="css/style-contact.css" rel="stylesheet">
    
    <link rel="shortcut icon" href="images/favicon.ico">

    <!-- HTML5 shim, for IE6-8 support of HTML5 elements. All other JS at the end of file. -->
    <!--[if lt IE 9]>
      <script src="js/html5shiv.js"></script>
      <script src="js/respond.min.js"></script>
    <![endif]-->
</head>
<body>
    
    <div id="page" class="page">
    
    	<div class="item contact padding-top-0 padding-bottom-0" id="contact1">
    	
    		<div class="wrapper grey">
    	
    			<div class="container">
    		
    				<div class="col-md-5">
    			
    					<h3 class="margin-bottom-40 editContent">Get in touch! We're here for you... [blade template]</h3>
                        <?php var_dump("abc");
                        var_dump($data);?>
    				    <?php  if(isset($data['news'])){ ?>
                        <h4><?php echo "test"; ?></h4>
                        <?php } ?>
                        <?php  if(1){ ?>
                        <h4><?php echo "try demo"; ?></h4>
                        <?php } ?>
    					<form role="form">
    				
    						<div class="form-group">
    				    		<input type="text" class="form-control input-lg" id="name" name="name" placeholder="Your name *">
    				  		</div>
    				  	    				  	
    				  		<div class="form-group">
    				  			<input type="email" class="form-control input-lg" id="email" name="email" placeholder="Your email *">
    				  		</div>
    				  	
    				  		<div class="form-group">
    				  			<input type="phone" class="form-control input-lg" id="phone" name="phone" placeholder="Your phone number">
    				  		</div>
    				  		
    				  		<div class="form-group">
    				  			<textarea class="form-control" rows="4" placeholder="Add comment..."></textarea>
    				  		</div>
    				  
    				    	<label class="checkbox" for="checkbox1">
    				 			<input type="checkbox" checked value="" id="checkbox1" data-toggle="checkbox">
    				    		Keep me in the loop
    				  		</label>
    				  	
    				  		<hr>
    				  	
    				  		<button type="submit" class="btn btn-primary btn-embossed btn-lg btn-wide">Submit contact form</button>
    				
    					</form>
    			
    				</div><!-- /.col-md-5 -->
    			
    				<div class="col-md-6 col-md-offset-1">
	    				
	    				<div class="editContent">
    					<h5>Other ways to get in touch:</h5>
    				
    					<p class="text-light margin-bottom-40">
    						Nulla non enim leo. Fusce ut magna ut neque gravida elementum eget id ante. Cras pharetra ligula sed risus congue, non iaculis ligula mollis. 
    					</p>
	    				</div><!-- /.editContent -->
    				
    					<p>
    						<b class="chead"><span class="fa fa-map-marker"></span>ADDRESS</b><br>
    						<span class="editContent">
    						234 Somewhere Street<br>
    						Somewhere Town<br>
    						10100 Planet Earth
    						</span>
    					</p>
    				
    					<p>
    						<b class="chead"><span class="fa fa-phone"></span> PHONE</b><br>
    						<span class="editContent">012 3456 7890</span>
    					</p>
    				
    					<p>
    						<b class="chead"><span class="fa fa-envelope"></span> EMAIL</b><br>
    						<a href="#" class="editContent">info@something.com</a>
    					</p>
    			
    				</div><!-- /.col-md-6 -->
    		
    			</div><!-- /.container -->
    		
    		</div><!-- /.wrapper -->
    	
    	</div><!-- /.item -->
    
    </div><!-- /#page -->

    <!-- Load JS here for greater good =============================-->
    <script src="js/build/build.min.js"></script>
</body>
</html>
