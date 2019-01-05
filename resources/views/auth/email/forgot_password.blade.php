<html>
<body>
	<h1>Reset Password for {{ $email }}</h1>
	<p>Please click this link to <a href="{{ route('user-pw-reset-code', ['code' => $code]) }}">Reset Your Password</a></p>
</body>
</html>