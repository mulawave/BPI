<?php
defined('BASEPATH') OR exit('No direct script access allowed');
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>BeepAgro's Palliative Initiative:</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="BeepAgro's Palliative Initiative: Cultivating Change for UN SDGs 1, 2, 4 & 11 – Eliminating Poverty, Hunger, Promoting Education, and Advancing Affordable Housing">
    <link rel="stylesheet" href="<?php echo base_url('assets/font/iconsmind/style.css') ?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/font/simple-line-icons/css/simple-line-icons.css') ?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap.min.css') ?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap-float-label.min.css') ?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/main.css') ?>" />
</head>

<body class="background show-spinner">
    <div class="fixed-background"></div>
    <main>
        <div class="container">
            <div class="row h-100">
                <div class="col-12 col-md-10 mx-auto my-auto">
                    <div class="card auth-card">
                        <div class="position-relative image-side ">

                           <!-- <p class=" text-white h2">MAGIC IS IN THE DETAILS</p>

                            <p class="white mb-0">
                                Please use your credentials to login.
                                <br>If you are not a member, please
                                <a href="<?php //echo base_url('register'); ?>" class="white">register</a>.
                            </p>-->
                        </div>
                        <div class="form-side">
                            <a href="https://beepagro.com">
                                <span class="logo-single">
                                    <img src="<?php echo base_url('assets/img/beep_agro_logo1.jpg'); ?>" style="width:70px; height:70px;">
                                </span>
                            </a>
                            <div class="float-right">
                            <h3 class="mb-4 mt-2" class="text-primary">BPI Validator</h3>
                            </div><br><br><br><br>
                            <div>
                <?php
                $error = $this->session->flashdata('error');
                if($error)
                { ?>
                            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                                <?php echo $this->session->flashdata('error'); ?>
                            </div>
                <?php } ?>
                <?php  
                        $success = $this->session->flashdata('success');
                        if($success)
                        {
                    ?>
                            <div class="alert alert-success alert-dismissible fade show" role="alert">
                                <?php echo $this->session->flashdata('success'); ?>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                <?php } ?>
                <?php echo validation_errors('<div class="alert alert-warning alert-dismissible fade show" role="alert"><strong>Form Errors!</strong>'.$this->session->flashdata('errors').'</div>'); ?>
                </div>
							<label class="mb-4">Enter Login Pin</label>
                                <input type="text" placeholder="xxxxxxxxxxx" onKeyUp="checkLogin()" class="form-control" name="pin" id="pin" required>
								<div id="space_break">
									<br><br><br><br><br><br><br>
							    </div>
							<div id="franchise_data" class="mt-3 mb-3">
							
							</div>
							<div id="message">
							
							</div>
							<div id="ticket-content" style="display: none;">
								 <label class="mb-4">Ticket Code</label>
                                    <input type="text" class="form-control mb-4" name="code" placeholder="Enter Ticket Code" required>
                               
                                <div class="mt-4">
                                  <button class="btn float-right btn-primary btn-lg btn-shadow" type="submit">Verify Code</button>
                                </div>
							</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <script src="<?php echo base_url('assets/js/vendor/jquery-3.3.1.min.js') ?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/bootstrap.bundle.min.js') ?>"></script>
    <script src="<?php echo base_url('assets/js/dore.script.js') ?>"></script>
       <script>
        
function loadStyle(href, callback) {
  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].href == href) {
      return;
    }
  }
  var head = document.getElementsByTagName("head")[0];
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = href;
  if (callback) {
    link.onload = function() {
      callback();
    };
  }
  head.appendChild(link);
}
/* 02. Theme Selector And Initializer */
(function($) {
  if ($().dropzone) {
    Dropzone.autoDiscover = false;
  }
  
  var themeColorsDom =
    ' ';
  $("body").append(themeColorsDom);
  var theme = "dore.dark.orange.min.css";

  if (typeof Storage !== "undefined") {
    if (localStorage.getItem("theme")) {
      theme = localStorage.getItem("theme");
    }
  }

  $(".theme-color[data-theme='" + theme + "']").addClass("active");

  loadStyle("<?php echo base_url('assets/css/');?>" + theme, onStyleComplete);
  function onStyleComplete() {
    setTimeout(onStyleCompleteDelayed, 300);
  }

  function onStyleCompleteDelayed() {
    var $dore = $("body").dore();
  }

  $("body").on("click", ".theme-color", function(event) {
    event.preventDefault();
    var dataTheme = $(this).data("theme");
    if (typeof Storage !== "undefined") {
      localStorage.setItem("theme", dataTheme);
      window.location.reload();
    }
  });


  $(".theme-button").on("click", function(event) {
    event.preventDefault();
    $(this)
      .parents(".theme-colors")
      .toggleClass("shown");
  });
  $(document).on("click", function(event) {
    if (
      !(
        $(event.target)
          .parents()
          .hasClass("theme-colors") ||
        $(event.target)
          .parents()
          .hasClass("theme-button") ||
        $(event.target).hasClass("theme-button") ||
        $(event.target).hasClass("theme-colors")
      )
    ) {
      if ($(".theme-colors").hasClass("shown")) {
        $(".theme-colors").removeClass("shown");
      }
    }
  });
})(jQuery);

        
        
    </script>
	<script>
    function checkLogin(){
            $('#message').html('Pin must be 6 digits...');
            $('#message').fadeIn();
            var code = $('#pin').val();
            //alert(code);
		    if(code.length == 6){
				 $('#message').html('Checking Pin...');
            $.ajax({    
               type:'POST',
               url: '<?php echo base_url(); ?>transaction/check_pin',
               data :  {code:code},
               dataType: "text",  
               cache:false,
               success: 
                function(data){
              //  alert(data);  //as a debugging message.
                $('#space_break').fadeOut();
                $('#franchise_data').html(data);
                $('#franchise_data').show();
				$('#message').hide();
              }
            });
		  }
        }
</script>
<!--Start of Tawk.to Script-->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/6629bb3fa0c6737bd13007ec/1hs9g6sk0';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
<!--End of Tawk.to Script-->
</body>

</html>