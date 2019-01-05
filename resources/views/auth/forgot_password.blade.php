@extends('layouts.login')

@section('title')
Login | SiteBuilder Lite
@endsection

@section('content')

<div class="container">

    <div class="row">
        <div class="col-md-12">
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
        </div><!-- /.col -->
    </div><!-- /.row -->

    <div class="row">

        <div class="col-md-4 col-md-offset-4">

            <h2 class="text-center">
                <b>SITE</b>BUILDER
            </h2>

            <p>Please enter your Email so we can send you an email to reset your password.</p>

            <?php if( isset($message) && $message != '' ):?>
                <div class="alert alert-success">
                    <button data-dismiss="alert" class="close fui-cross" type="button"></button>
                    <?php echo $message;?>
                </div>
            <?php endif;?>

            <form role="form" action="{{ route('recover.password') }}" method="post">

                <div class="input-group">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-user"></span></button>
                    </span>
                    <input type="email" class="form-control" id="email" name="email" placeholder="Your email address">
                </div>
                <input type="hidden" name="_token" value="{{ Session::token() }}">
                <button type="submit" class="btn btn-primary btn-block">Submit <span class="fui-triangle-right-large"></span></button>

                <hr class="dashed light">

                <div class="text-center">
                    <a href="{{ route('home') }}" style="font-size: 15px"><span class="fui-arrow-left"></span> back to login</a>
                </div>

            </form>

        </div><!-- /.col -->

    </div><!-- /.row -->

</div><!-- /.container -->
@endsection