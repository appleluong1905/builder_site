@extends('layouts.master')

@section('title')
Dashboard | Users
@endsection

@section('content')

@include('includes.nav-bar')

<div class="container-fluid">
	<div class="row">
		<div class="col-md-9 col-sm-8">
			<h1><span class="fui-user"></span> Users</h1>
		</div><!-- /.col -->

		<div class="col-md-3 col-sm-4 text-right">
			<a href="#newUserModal" data-toggle="modal" class="btn btn-lg btn-primary btn-embossed btn-wide margin-top-40"><span class="fui-plus"></span> Add New User</a>
		</div><!-- /.col -->
	</div><!-- /.row -->
	<hr class="dashed margin-bottom-30">
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
			<div class="masonry-4 users" id="users">
				@include('partials.users')
			</div><!-- /.masonry -->
		</div><!-- /.col -->
	</div><!-- /.row -->
</div><!-- /.container -->

<!-- Modals -->
@include('includes.modal-sitesettings')

@include('includes.modal-deletesite')

<div class="modal fade deleteUserModal" id="deleteUserModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
				<h4 class="modal-title" id="myModalLabel"><span class="fui-info"></span> Are you sure?</h4>
			</div>
			<div class="modal-body">
				<p>Deleting this user account will result in all associated data being deleted (with the exception of externally published sites) and <b>can not be undone</b>. Are you sure you want to continue?</p>
			</div><!-- /.modal-body -->
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal"><span class="fui-cross"></span> Cancel</button>
				<a href="" type="button" class="btn btn-primary" id="deleteUserButton"><span class="fui-check"></span> Yes, I'm sure</a>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div><!-- /.modal -->

<div class="modal fade newUserModal" id="newUserModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	<form class="form-horizontal" role="form" action="{{ route('user-create') }}">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
					<h4 class="modal-title" id="myModalLabel"><span class="fui-user"></span> Create a new user account</h4>
				</div>
				<div class="modal-body padding-top-40">
					<div class="loader" style="display: none;">
						<img src="{{ URL::to('src/images/loading.gif') }}" alt="Loading...">
						Creating new account...
					</div>
					<div class="modal-alerts"></div>
					<div class="form-group">
						<label for="username" class="col-md-3 control-label">First name:</label>
						<div class="col-md-9">
							<input type="text" class="form-control" id="first_name" name="first_name" placeholder="First name" value="">
						</div>
					</div>
					<div class="form-group">
						<label for="username" class="col-md-3 control-label">Last name:</label>
						<div class="col-md-9">
							<input type="text" class="form-control" id="last_name" name="last_name" placeholder="Last name" value="">
						</div>
					</div>
					<div class="form-group">
						<label for="username" class="col-md-3 control-label">Email:</label>
						<div class="col-md-9">
							<input type="email" class="form-control" id="email" name="email" placeholder="Email" value="">
						</div>
					</div>
					<div class="form-group">
						<label for="password" class="col-md-3 control-label">Password:</label>
						<div class="col-md-9">
							<input type="password" class="form-control" id="password" name="password" placeholder="Password" value="">
						</div>
					</div>
					<div class="form-group">
						<div class="col-md-offset-3 col-md-9">
							<label class="checkbox" for="type" style="padding-top: 0px;">
								<input type="checkbox" value="admin" name="type" id="type" data-toggle="checkbox">
								Admin permissions
							</label>
						</div>
					</div>
				</div><!-- /.modal-body -->
				<input type="hidden" name="_token" value="{{ Session::token() }}">
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal"><span class="fui-cross"></span> Cancel</button>
					<button type="button" class="btn btn-primary" id="buttonCreateAccount"><span class="fui-check"></span> Create Account</button>
				</div>
			</div><!-- /.modal-content -->
		</div><!-- /.modal-dialog -->
	</form>
</div><!-- /.modal -->

@include('includes.modal-account')

<!-- /Modals -->

<!-- Load JS here for greater good =============================-->
<script src="{{ URL::to('src/js/vendor/jquery.min.js') }}"></script>
<script src="{{ URL::to('src/js/vendor/flat-ui-pro.min.js') }}"></script>
<script src="{{ URL::to('src/js/vendor/jquery.zoomer.js') }}"></script>
<script src="{{ URL::to('src/js/build/users.js') }}"></script>
<!--[if lt IE 10]>
<script>
$(function(){
	var msnry = new Masonry( '#users', {
    	// options
    	itemSelector: '.user',
    	"gutter": 20
    });

})
</script>
<![endif]-->

@endsection