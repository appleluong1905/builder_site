@extends('layouts.login')

@section('title')
Login | SiteBuilder Lite
@endsection

@section('content')

<div class="container">
    <div class="row">
        <div class="col-md-4 col-md-offset-4">
            <h2 class="text-center">
                <b>SITE</b>BUILDER
            </h2>
            @if( Session::has('success') )
            <div class="alert alert-success">
                <button type="button" class="close fui-cross" data-dismiss="alert"></button>
                {{ Session::get('success') }}
            </div>
            @endif
            @if( Session::has('error') )
            <div class="alert alert-error">
                <button type="button" class="close fui-cross" data-dismiss="alert"></button>
                {{ Session::get('error') }}
            </div>
            @endif
            @if( Session::has('message') )
            <div class="alert alert-success">
                <button type="button" class="close fui-cross" data-dismiss="alert"></button>
                {{ Session::get('message') }}
            </div>
            @endif
            <form role="form" action="{{ route('signin') }}" method="post">
                <div class="input-group {{ $errors->has('email') ? 'has-error' : '' }}">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-user"></span></button>
                    </span>
                    <input type="email" class="form-control" id="email" name="email" tabindex="1" autofocus placeholder="Your email address" value="{{ Request::old('email') }}">
                </div>
                <div class="input-group">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-lock"></span></button>
                    </span>
                    <input type="password" class="form-control" id="password" name="password" tabindex="2" placeholder="Your password">
                </div>
                <label class="checkbox margin-bottom-20" for="checkbox1">
                    <input type="checkbox" value="1" id="remember" name="remember" tabindex="3" data-toggle="checkbox">
                    Remember me
                </label>
                <input type="hidden" name="_token" value="{{ Session::token() }}">
                <button type="submit" class="btn btn-primary btn-block btn-embossed" tabindex="4">Log me in<span class="fui-arrow-right"></span></button>
                <div class="row">
                    <div class="col-md-12 text-center">
                        <a href="{{ route('forgot.password') }}">Lost your password?</a>
                    </div>
                </div><!-- /.row -->
            </form>
            <div class="divider">
                <span>OR</span>
            </div>
            <h2 class="text-center margin-bottom-25">
                Join <b>today</b>
            </h2>
            <a href="{{ route('signup') }}" class="btn btn-block btn-inverse btn-embossed">SIGN UP NOW <span class="fui-new"></span></a>
        </div><!-- /.col -->
    </div><!-- /.row -->
</div><!-- /.container -->
@endsection