<!DOCTYPE html>
<html lang="en">

<head> 
    <meta charset="UTF-8">
    <title>Beep Agro</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

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
                            
                        </div>
                        <div class="form-side">
                            <a href="#">
                               <h3>Enter Your Email</h3>
                               <p>A password reset link will be sent to you if your email is found in our system</p>
                            </a>
                            <br><br>
                            <h6 class="mb-4">Forgot Password</h6>
                            <?php echo form_open('partners/send_reset_link'); ?>
                                <label class="form-group has-float-label mb-4">
                                    <input class="form-control" type="email" name="email" required />
                                    <span>E-mail</span>
                                </label>                               
                                <div class="d-flex justify-content-between align-items-center">
                                    <button class="btn btn-primary btn-lg btn-shadow mb-4" type="submit">Send Reset Link</button>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mx-auto my-auto"><br><br>
                                    <a href="<?php echo base_url('partners');?>">Login Instead</a>
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