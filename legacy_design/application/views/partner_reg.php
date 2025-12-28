<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Beep Agro Palliative | Register</title>
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
          <div class="position-relative image-side "> </div>
          <div class="form-side">
            <p class=" text-white h2">Welcome to Beep Agro Partner Portal</p>
            <p class="white mb-0 mt-2 mb-2"> Please use this form to create a partner account. If you are already a partner, please <a href="<?php echo base_url('partners') ?>" class="text-primary">login Here</a>. </p>
            <br>
            <div>
              <?php if ($this->session->flashdata('success')): ?>
              <p style="color: green;">
                <?= $this->session->flashdata('success'); ?>
              </p>
              <?php endif; ?>
              <?php if ($this->session->flashdata('error')): ?>
              <p style="color: red;">
                <?= $this->session->flashdata('error'); ?>
              </p>
              <?php endif; ?>
            </div>
            <form method="post" action="<?php echo base_url('partners/process_registration'); ?>">
              <?php echo validation_errors(); ?>
              <label class="form-group has-float-label mb-2">
                <input class="form-control" type="text" name="name" required value="<?php echo set_value('name'); ?>" />
                <span>Company Name</span> </label>
              <label class="form-group has-float-label mb-2">
                <input class="form-control" type="email" name="email" required value="<?php echo set_value('email'); ?>" />
                <span>Email</span> </label>
              <label class="form-group has-float-label mb-2">
                <input class="form-control" type="password" required name="password" />
                <span>Password</span> </label>
              <label class="form-group has-float-label mb-2">
                <input class="form-control" type="password" required name="confirm_password" />
                <span>Confirm Password</span> </label>
			  <label class="form-group has-float-label mb-2">	
			<?php $countries = $this->generic_model->get_countries(); ?>
              <select name="country" id="country_id" class="form-control form-control-lg" onchange="getstates()">
                <option value="">Set Country</option>
                <?php foreach($countries as $country){ ?>
                <option value="<?php echo $country->id; ?>"><?php echo $country->country_name; ?></option>
                <?php } ?>
              </select>
              <div class="invalid-tooltip"> Please Choose a country. </div>
				</label>
			  <label class="form-group has-float-label mb-2">
              <div id="statePop">
                <select class="form-control form-control-lg">
                  <option value="">Select Country First</option>
                </select>
              </div>
              <div id="statePopmessage" class="text-primary mt-2" style="display:none"></div>
              <div class="invalid-tooltip"> Please choose a state. </div>
				</label>
			  <label class="form-group has-float-label mb-4">
              <div id="cityPop">
                <select class="form-control form-control-lg">
                  <option value="">Select Country and State/Region First</option>
                </select>
              </div>
              <div id="cityPopmessage" class="text-primary mt-2" style="display:none"></div>
              <div class="invalid-tooltip"> Please Choose a city. </div>
				</label>
              <input type="hidden" name="ref" id="ref" value="<?php if(!empty($referral_code)){ echo $referral_code; }else{ echo '';}  ?>">
              <label class="form-check mb-4">
                <input class="form-check-input" type="checkbox" checked name="terms" required <?php echo set_checkbox('terms', '1'); ?> /> 
                <span class="form-check-label">By submitting this form, you agree to be bound by our terms of service</span> </label>
              <div class="d-flex justify-content-end align-items-center">
                <button class="btn btn-primary btn-lg btn-shadow" type="submit">REGISTER</button>
              </div>
            </form>
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
<script>

    function getstates(){

            $('#statePopmessage').html('Fetching States...');

            $('#statePopmessage').fadeIn();

            var code = $('#country_id').val();

            //alert(code);

            if(code =='all'){

                $('#city').val('all');

            }else{

            $.ajax({    

               type:'POST',

               url: '<?php echo base_url(); ?>get_states',

               data :  {code:code},

               dataType: "text",  

               cache:false,

               success: 

                function(data){

              //  alert(data);  //as a debugging message.

                $('#statePopmessage').fadeOut();

                $('#statePop').html(data);

                $('#statePop').show();

              }

            });

            }

        }

    function getCities(){

            $('#cityPopmessage').html('Fetching Cities...');

            $('#cityPopmessage').fadeIn();

            var code = $('#state_id').val();

            $.ajax({    

               type:'POST',

               url: '<?php echo base_url(); ?>get_cities',

               data :  {code:code},

               dataType: "text",  

               cache:false,

               success: 

                function(data){

               $('#cityPopmessage').fadeOut();

                $('#cityPop').html(data);

                 $('#cityPop').show();

              }

            });

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