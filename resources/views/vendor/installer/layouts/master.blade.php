<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ trans('messages.title') }}</title>
    <link rel="icon" type="image/png" href="{{ asset('installer/img/favicon/favicon-16x16.png') }}" sizes="16x16"/>
    <link rel="icon" type="image/png" href="{{ asset('installer/img/favicon/favicon-32x32.png') }}" sizes="32x32"/>
    <link rel="icon" type="image/png" href="{{ asset('installer/img/favicon/favicon-96x96.png') }}" sizes="96x96"/>
    <link href="{{ asset('installer/css/style.min.css') }}" rel="stylesheet"/>
  </head>
  <body>
    <div class="master">
      <div class="box">
        <div class="header">
            <h1 class="header__title">@yield('title')</h1>
        </div>
        <ul class="step">
          <li class="step__divider"></li>
          <li class="step__item {{ isActive('LaravelInstaller::final') }}"><i class="step__icon database"></i></li>
          <li class="step__divider"></li>
          <li class="step__item {{ isActive('LaravelInstaller::permissions') }}"><i class="step__icon permissions"></i></li>
          <li class="step__divider"></li>
          <li class="step__item {{ isActive('LaravelInstaller::requirements') }}"><i class="step__icon requirements"></i></li>
          <li class="step__divider"></li>
          <li class="step__item {{ isActive('LaravelInstaller::environment') }}"><i class="step__icon update"></i></li>
          <li class="step__divider"></li>
          <li class="step__item {{ isActive('LaravelInstaller::welcome') }}"><i class="step__icon welcome"></i></li>
          <li class="step__divider"></li>
        </ul>
        <div class="main">
          @yield('container')
        </div>
      </div>
    </div>
    <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
    <script>
    (function () {

        $('#envForm').on('submit', function () {

            var allGood = true;

            if( document.getElementById('hostname').value === '' ) {
                document.getElementById('hostname').classList.add('error');
                allGood = false;
            } else {
                document.getElementById('hostname').classList.remove('error');
            }

            if( document.getElementById('database').value === '' ) {
                document.getElementById('database').classList.add('error');
                allGood = false;
            } else {
                document.getElementById('database').classList.remove('error');
            }

            if( document.getElementById('username').value === '' ) {
                document.getElementById('username').classList.add('error');
                allGood = false;
            } else {
                document.getElementById('username').classList.remove('error');
            }

            if( document.getElementById('password').value === '' ) {
                document.getElementById('password').classList.add('error');
                allGood = false;
            } else {
                document.getElementById('password').classList.remove('error');
            }

            if( document.getElementById('url').value === '' ) {
                document.getElementById('url').classList.add('error');
                allGood = false;
            } else {
                document.getElementById('url').classList.remove('error');
            }

            if( allGood ) return true;
            else return false;

        });

    } ());
    </script>
  </body>
</html>