<!DOCTYPE html>
<html>
<head>
	<title>@yield('title')</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">

	<link rel="shortcut icon" href="{{ URL::to('src/images/favicon.ico') }}">

	<link href="{{ URL::to('src/css/vendor/bootstrap.min.css') }}" rel="stylesheet">
	<link href="{{ URL::to('src/css/flat-ui-pro.css') }}" rel="stylesheet">
	<link href="{{ URL::to('src/css/style.css') }}" rel="stylesheet">
	<link href="{{ URL::to('src/css/login.css') }}" rel="stylesheet">
	<link href="{{ URL::to('src/css/font-awesome.css') }}" rel="stylesheet">

	<link href="{{ URL::to('src/css/builder.css') }}" rel="stylesheet">
	<link href="{{ URL::to('src/css/spectrum.css') }}" rel="stylesheet">
	<link href="{{ URL::to('src/css/chosen.css') }}" rel="stylesheet">
	<link href="{{ URL::to('src/css/summernote.css') }}" rel="stylesheet">

	<!--<link rel="stylesheet" href="{{ URL::to('src/css/build-main.min.css') }}">-->
</head>
<body class="login">

	@yield('content')

	<script src="{{ URL::to('src/js/vendor/jquery.min.js') }}"></script>
	<script src="{{ URL::to('src/js/vendor/flat-ui-pro.min.js') }}"></script>
	<!--<script src="{{ URL::to('src/js/build/login.min.js') }}" type="text/javascript"></script>-->
</body>
</html>