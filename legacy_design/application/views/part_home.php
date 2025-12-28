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
    <link rel="stylesheet" href="<?php echo base_url('assets_part/font/iconsmind/style.css') ?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/font/simple-line-icons/css/simple-line-icons.css') ?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/bootstrap.min.css') ?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/vendor/bootstrap-float-label.min.css') ?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets_part/css/main.css') ?>" />
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
                                    <img src="<?php echo base_url('assets_part/img/beep_agro_logo1.jpg'); ?>" style="width:70px; height:70px;">
                                </span>
                            </a>
                            <div class="float-right">
                            <h3 class="mb-4 mt-2" class="text-primary">PARTNER PORTAL</h3>
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
                            <?php echo form_open('partners/process_login'); ?>
                                <label class="form-group has-float-label mb-4">
                                    <input type="email" class="form-control" name="email" required>
                                    <span>E-mail</span> 
                                </label>

                                <label class="form-group has-float-label mb-4">
                                    <input type="password" class="form-control" name="password" required>
                                    <span>Password</span>
                                </label>
                                <div class="d-flex justify-content-between align-items-center">
                                    <a href="<?php echo base_url('part_forgot_password');?>">Forget password?</a>
                                        <button class="btn btn-primary btn-lg btn-shadow" type="submit">LOGIN</button>
                                </div>
                                <div>
                                    <a href="<?php echo base_url('part_reg'); ?>">Register as a Partner</a>
                                </div>
                            <?php echo form_close(); ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <script src="<?php echo base_url('assets_part/js/vendor/jquery-3.3.1.min.js') ?>"></script>
    <script src="<?php echo base_url('assets_part/js/vendor/bootstrap.bundle.min.js') ?>"></script>
    <script src="<?php echo base_url('assets_part/js/dore.script.js') ?>"></script>
       <script>
        /* Dore Theme Select & Initializer Script 

Table of Contents

01. Css Loading Util
02. Theme Selector And Initializer
*/

/* 01. Css Loading Util */
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

  loadStyle("<?php echo base_url('assets_part/css/');?>" + theme, onStyleComplete);
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