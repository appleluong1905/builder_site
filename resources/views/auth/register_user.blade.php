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

            @if( Session::has('message') )
            <div class="alert alert-success">
                <button type="button" class="close fui-cross" data-dismiss="alert"></button>
                {{ Session::get('message') }}
            </div>
            @endif

            <form role="form" action="{{ route('signup') }}" method="post">

                <div class="input-group {{ $errors->has('first_name') ? 'has-error' : '' }}">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-arrow-right"></span></button>
                    </span>
                    <input type="text" class="form-control" id="first_name" name="first_name" tabindex="1" placeholder="First name *" value="{{ Request::old('first_name') }}">
                </div>

                <div class="input-group {{ $errors->has('last_name') ? 'has-error' : '' }}">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-arrow-right"></span></button>
                    </span>
                    <input type="text" class="form-control" id="last_name" name="last_name" tabindex="2" placeholder="Last name *" value="{{ Request::old('last_name') }}">
                </div>

                <div class="input-group {{ $errors->has('email') ? 'has-error' : '' }}">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-arrow-right"></span></button>
                    </span>
                    <input type="email" class="form-control" id="email" name="email" tabindex="3" placeholder="Email *" value="{{ Request::old('email') }}">
                </div>

                <div class="input-group {{ $errors->has('password') ? 'has-error' : '' }}">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-arrow-right"></span></button>
                    </span>
                    <input type="password" class="form-control" id="password" name="password" tabindex="4" placeholder="Password *" value="">
                </div>

                <div class="input-group {{ $errors->has('password_confirmation') ? 'has-error' : '' }}">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-arrow-right"></span></button>
                    </span>
                    <input type="password" class="form-control" id="password_confirmation" name="password_confirmation" tabindex="5" placeholder="Confirm password *" value="">
                </div>

                {!! captcha_image_html('RegisterCaptcha') !!}

                <div class="input-group">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-arrow-right"></span></button>
                    </span>
                    <input type="text" class="form-control" id="captcha" name="CaptchaCode" tabindex="6" placeholder="Enter the letters from the image *">
                </div>
                <input type="hidden" name="_token" value="{{ Session::token() }}">
                <button type="submit" class="btn btn-primary btn-block btn-embossed" tabindex="7">Create Account</span></button>

                <hr class="dashed light">

                <div class="text-center">
                    <a href="{{ route('home') }}" style="font-size: 15px"><span class="fui-arrow-left"></span> back to login</a>
                </div>

            </form>

        </div><!-- /.col -->

    </div><!-- /.row -->

</div><!-- /.container -->

@endsection