@extends('layouts.login')

@section('title')
Reset password | SiteBuilder Lite
@endsection

@section('content')

<div class="container">
    <div class="row">
        <div class="col-md-4 col-md-offset-4">
            <h2 class="text-center">
                <b>SITE</b>BUILDER
            </h2>
            <?php if( isset($message) && $message != '' ):?>
                <div class="alert alert-success">
                    <button data-dismiss="alert" class="close fui-cross" type="button"></button>
                    <?php echo $message;?>
                </div>
            <?php endif;?>
            <form role="form" action="{{ route('user-pw-reset') }}" method="post">
                <div class="input-group">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-lock"></span></button>
                    </span>
                    <input type="password" class="form-control" pattern="^.{8}.*$" id="new" value="" name="new" placeholder="Your new password">
                </div>
                <div class="input-group">
                    <span class="input-group-btn">
                        <button class="btn"><span class="fui-lock"></span></button>
                    </span>
                    <input type="password" class="form-control"  pattern="^.{8}.*$" id="new_confirm" value="" name="new_confirm" placeholder="Repeat your new password">
                </div>
                <input type="hidden" name="user_id" value="{{ $user->id }}">
                <input type="hidden" name="forgotten_password_code" value="{{ $user->forgotten_password_code }}">
                <input type="hidden" name="_token" value="{{ Session::token() }}">
                <button type="submit" class="btn btn-primary btn-block">Change <span class="fui-triangle-right-large"></span></button>
                <hr class="dashed light">
            </form>
        </div><!-- /.col -->
    </div><!-- /.row -->
</div><!-- /.container -->

<!-- Load JS here for greater good =============================-->
<script src="{{ URL::to('src/js/vendor/jquery.min.js') }}"></script>
<script src="{{ URL::to('src/js/vendor/flat-ui-pro.min.js') }}"></script>
@endsection
